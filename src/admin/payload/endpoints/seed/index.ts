import { promises as fs } from "fs"
import path from "path"
import type { Payload } from "payload"

// Import profile system
import { 
  type SeedProfile, 
  minimalProfile, 
  defaultProfile 
} from "./profiles"

// Import all data functions
import { regenerateURIs } from "@/admin/routing/index-manager"
import { disableSyncHooks, enableSyncHooks } from "@/admin/utilities/prevent-hooks"
import { formatIdForText, formatIdForRelationship } from "@/admin/payload/db/id-utils"
import { primaryContactForm } from "./forms/primary-contact"
import { 
  minimalHeaderGlobal, 
  minimalFooterGlobal, 
  minimalSettingsGlobal 
} from "./globals/minimal-globals"
import { minimalPages } from "./pages/minimal-pages"
import { seedUser } from "./users/user"
import { seedAIAgent, ensureAIAgentWithAPIKey } from "./users/ai-agent"
import { postMinimalTemplate } from "./templates/post-minimal"
import { insightsMinimalPage } from "./pages/insights-minimal"
import { sampleMinimalPosts } from "./posts/minimal-posts"

// Types
type SeedResult = {
  success: boolean
  message: string
  stats: {
    created: Record<string, number>
    errors: string[]
  }
  duration: number
}

type SeedOptions = {
  blog?: boolean
}

/*************************************************************************/
/*  DYNAMIC SEED MANAGER CLASS
/*
/*  This class handles comprehensive database seeding and deletion for Payload CMS.
/*
/*  DELETION FEATURES:
/*  - Properly deletes media files (both database records AND physical files)
/*  - Handles pagination for large datasets (processes in 100-item batches)
/*  - Cleans up system collections (locked documents, preferences, etc.)
/*  - Supports preserving users or complete wipe
/*  - Provides detailed logging and error reporting
/*
/*  SEEDING FEATURES:
/*  - Downloads and processes remote images
/*  - Creates all collections with proper relationships
/*  - Updates navigation with reference links to actual services
/*  - Handles errors gracefully and continues processing
/*
/*  USAGE:
/*  const seedManager = new DynamicSeedManager(payload)
/*  await seedManager.deleteData(preserveUsers: boolean)
/*  await seedManager.seedDatabase(options)
/*************************************************************************/

class DynamicSeedManager {
  private payload: Payload
  private mediaFiles: Map<string, any> = new Map()
  private context: any = {}
  private profile: SeedProfile
  private blogEnabled: boolean = false
  private postTemplateId: string | null = null
  private readonly siteName: string

  constructor(payload: Payload, siteName: string) {
    this.payload = payload
    this.profile = defaultProfile // Default to minimal
    this.siteName = siteName
  }

  /*************************************************************************/
  /*  MAIN SEED DATABASE METHOD (MINIMAL-ONLY)
  /*
  /*  Starter seeds a minimal baseline only; no demo profile support
  /*************************************************************************/

  async seedDatabase(options?: SeedOptions): Promise<SeedResult> {
    // Minimal-only profile
    this.profile = minimalProfile
    this.blogEnabled = !!options?.blog
    
    this.payload.logger.info(`Using seed profile: ${this.profile.name} - ${this.profile.description}`)
    const startTime = Date.now()
    const stats = { created: {} as Record<string, number>, errors: [] as string[] }

    try {
      this.payload.logger.info("Starting dynamic database seeding...")

      /**
       * Step 0: Ensure database schema exists
       */
      this.payload.logger.info("Ensuring database schema exists...")
      try {
        // Force database connection which triggers schema creation with push: true
        await this.payload.find({
          collection: "users",
          limit: 1,
          context: this.context,
        })
        this.payload.logger.info("Database schema verified")
      } catch (schemaError) {
        this.payload.logger.info("Database schema will be created automatically")
      }

      /**
       * Step 1: Disable sync hooks for the entire seeding operation
       */
      disableSyncHooks(this.payload, this.context)

      /**
       * Step 2: Clean existing data (including users to fix password hash issues)
       */
      this.payload.logger.info("Cleaning existing data (including users)...")
      const deleteResult = await this.deleteData(false, false)

      // Don't fail the entire seeding if deletion fails on empty database
      if (!deleteResult.success) {
        this.payload.logger.info(
          "Deletion had issues (likely empty database), continuing with seeding..."
        )
      }

      /**
       * Step 3: Always create fresh users to ensure proper password hashing
       */
      this.payload.logger.info("Creating fresh admin user...")
      const seededUsers = await this.seedUsers()
      const usersCreated = seededUsers.length

      /**
       * Step 4: Seed content based on profile
       */
      let seededForms: any[] = []
      let seededPages: any[] = []
      let blogPages: any[] = []
      let blogPosts: any[] = []
      
      if (this.profile.seedFunctions.forms) {
        seededForms = await this.seedForms()
      }
      
      // Pages - handle minimal vs demo
      seededPages = await this.seedMinimalPages(seededForms)

      // Optional blog seeding
      if (this.blogEnabled) {
        this.postTemplateId = await this.seedPostTemplate()
        blogPages = await this.seedBlogPages()
        blogPosts = await this.seedBlogPosts(seededUsers)
      }
      
      // Globals - minimal-only
      const allPages = [...seededPages, ...blogPages]
      const seededGlobals = await this.seedGlobals(allPages)

      /**
       * Step 5: Create settings global FIRST to establish routing configuration
       * This sets up homepage, archive pages, and other routing rules that affect URI generation
       */
      await this.createSettingsGlobal(allPages)

      /**
       * Step 5.5: Invalidate settings cache to ensure URI regeneration uses fresh settings
       * This ensures getTemplateIdForCollection() reads the newly created settings
       */
      try {
        const { revalidateTag } = await import("next/cache")
        revalidateTag("global:settings")
        this.payload.logger.info("Invalidated settings cache for URI regeneration")
      } catch (error) {
        this.payload.logger.error("Failed to invalidate settings cache:", error)
      }

      /**
       * Step 6: Regenerate all URIs with proper routing configuration in place
       * Now that settings are configured, URIs will be generated with correct archive page prefixes
       */
      this.payload.logger.info("Regenerating URIs for all documents...")
      const regenerationStats = await regenerateURIs(this.context)
      this.payload.logger.info(
        `URI regeneration complete: ${regenerationStats.populated}/${regenerationStats.totalFound} documents processed`
      )

      /**
       * Step 6.5: Revalidate posts-related caches so new blog content appears immediately
       */
      if (this.blogEnabled) {
        try {
          const { revalidateTag } = await import("next/cache")
          // Invalidate collection and URI index cache tags for posts
          revalidateTag("collection:posts")
          revalidateTag("uri-index:posts")
          // Also revalidate the Insights archive page URI
          revalidateTag("uri:/insights")
          this.payload.logger.info("Revalidated posts collection and insights URI cache tags")
        } catch (error) {
          this.payload.logger.error("Failed to revalidate posts/insights cache tags:", error)
        }
      }

      /**
       * Step 7: Update header and footer globals with services for proper reference links
       * Keep hooks disabled during this step to prevent revalidation errors on archive pages
       * Only needed for demo profile
       */
      // No navigation enrichment needed in minimal profile

      // Update stats
      stats.created.users = usersCreated
      stats.created.forms = seededForms.length
      stats.created.pages = allPages.length
      stats.created.posts = blogPosts.length
      stats.created.globals = seededGlobals.length + 1 // +1 for settings global

      /**
       * Step 8: Create AI agent user at the very end (after all other seeding)
       */
      this.payload.logger.info("Creating AI agent user with API key...")
      try {
        const { user: aiAgent, apiKey } = await ensureAIAgentWithAPIKey(
          this.payload,
          this.context,
          this.siteName
        )
        
        // Store the API key securely (only shown once during creation)
        if (apiKey) {
          this.payload.logger.info("═══════════════════════════════════════════════════════════════")
          this.payload.logger.info("AI AGENT API KEY (SAVE THIS - SHOWN ONLY ONCE):")
          this.payload.logger.info(`API Key: ${apiKey}`)
          this.payload.logger.info(`Email: ${aiAgent.email}`)
          this.payload.logger.info(`User ID: ${aiAgent.id}`)
          this.payload.logger.info("═══════════════════════════════════════════════════════════════")
          
          // Optionally save to .env file for development
          if (process.env.NODE_ENV === "development") {
            await this.saveAPIKeyToEnv(apiKey, aiAgent.id)
          }
        } else {
          this.payload.logger.info(`AI agent already has API key configured (not shown for security)`)
        }
        
        stats.created.users += 1 // Add AI agent to user count
      } catch (error) {
        this.payload.logger.error("Failed to create AI agent user:", error)
        stats.errors.push(`AI agent creation failed: ${error}`)
        // Don't fail the entire seeding if AI agent creation fails
      }

      /**
       * Step 9: Re-enable sync hooks only at the very end
       */
      enableSyncHooks(this.payload, this.context)

      const duration = Date.now() - startTime
      this.payload.logger.info(`Database seeding completed in ${duration}ms`)

      return {
        success: true,
        message: "Database seeded successfully",
        stats,
        duration,
      }
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      stats.errors.push(errorMessage)

      this.payload.logger.error("Database seeding failed:", error)

      /**
       * Always re-enable hooks in case of error
       */
      try {
        enableSyncHooks(this.payload, this.context)
      } catch (disableError) {
        this.payload.logger.error(
          "Failed to re-enable hooks after seeding error:",
          disableError
        )
      }

      return {
        success: false,
        message: `Database seeding failed: ${errorMessage}`,
        stats,
        duration,
      }
    }
  }

  /*************************************************************************/
  /*  SAVE API KEY TO ENV FILE (DEVELOPMENT ONLY)
  /*************************************************************************/
  
  private async saveAPIKeyToEnv(apiKey: string, userId: string): Promise<void> {
    try {
      const envPath = path.join(process.cwd(), ".env")
      
      // Read existing .env
      let envContent = ""
      try {
        envContent = await fs.readFile(envPath, "utf-8")
      } catch (error) {
        this.payload.logger.error("Could not read .env file:", error)
        return
      }
      
      // Parse lines and update AI_AGENT entries in place
      const lines = envContent.split("\n")
      const updatedLines = []
      let foundApiKey = false
      let foundUserId = false
      let lastNonEmptyIndex = -1
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        
        // Update existing AI_AGENT_API_KEY
        if (line.startsWith("AI_AGENT_API_KEY=")) {
          updatedLines.push(`AI_AGENT_API_KEY=${apiKey}`)
          foundApiKey = true
        }
        // Update existing AI_AGENT_USER_ID
        else if (line.startsWith("AI_AGENT_USER_ID=")) {
          updatedLines.push(`AI_AGENT_USER_ID=${userId}`)
          foundUserId = true
        }
        // Keep all other lines
        else {
          updatedLines.push(line)
        }
        
        // Track last non-empty line
        if (line.trim() !== "") {
          lastNonEmptyIndex = updatedLines.length - 1
        }
      }
      
      // If we didn't find the variables, add them
      if (!foundApiKey || !foundUserId) {
        // Find where to insert (before a section or at the end)
        let insertIndex = lastNonEmptyIndex + 1
        
        // Look for the AI Agent Configuration comment
        let hasAISection = false
        for (let i = 0; i < updatedLines.length; i++) {
          if (updatedLines[i].includes("AI AGENT CONFIGURATION") || 
              updatedLines[i].includes("AI Agent Configuration")) {
            hasAISection = true
            insertIndex = i + 1
            // Skip the comment line if it exists
            while (insertIndex < updatedLines.length && 
                   updatedLines[insertIndex].startsWith("#")) {
              insertIndex++
            }
            break
          }
        }
        
        // If no AI section exists, add it at the end
        if (!hasAISection) {
          // Add blank line before new section if needed
          if (lastNonEmptyIndex >= 0 && updatedLines[lastNonEmptyIndex].trim() !== "") {
            updatedLines.splice(insertIndex, 0, "")
            insertIndex++
          }
          updatedLines.splice(insertIndex, 0, "# AI Agent Configuration (Auto-generated)")
          insertIndex++
        }
        
        // Add the missing variables
        if (!foundApiKey) {
          updatedLines.splice(insertIndex, 0, `AI_AGENT_API_KEY=${apiKey}`)
          insertIndex++
        }
        if (!foundUserId) {
          updatedLines.splice(insertIndex, 0, `AI_AGENT_USER_ID=${userId}`)
        }
      }
      
      // Write back to file
      await fs.writeFile(envPath, updatedLines.join("\n"))
      
      this.payload.logger.info("API key saved to .env for development use")
    } catch (error) {
      this.payload.logger.warn("Could not save API key to .env:", error)
    }
  }

  /*************************************************************************/
  /*  CREATE USERS
  /*************************************************************************/

  private async seedUsers(): Promise<any[]> {
    this.payload.logger.info("Creating fresh admin user...")
    const users = []

    // Create the regular admin user
    const userData = seedUser()
    const user = await this.payload.create({
      collection: "users",
      data: userData,
      context: this.context,
    })
    this.payload.logger.info(`Created fresh user: ${userData.username}`)
    users.push(user)

    return users
  }

  /*************************************************************************/
  /*  BLOG: MINIMAL TEMPLATE FOR POSTS
  /*************************************************************************/

  private async seedPostTemplate(): Promise<string | null> {
    return await postMinimalTemplate(this.payload, this.context)
  }

  /*************************************************************************/
  /*  BLOG: MINIMAL INSIGHTS PAGE
  /*************************************************************************/

  private async seedBlogPages(): Promise<any[]> {
    const pages: any[] = []
    try {
      const pageData = insightsMinimalPage()
      const page = await this.payload.create({ collection: "pages", data: pageData as any, context: this.context })
      pages.push(page)
    } catch (error) {
      this.payload.logger.error("Error creating insights page:", error)
    }
    return pages
  }

  /*************************************************************************/
  /*  BLOG: MINIMAL POSTS
  /*************************************************************************/

  private async seedBlogPosts(users: any[]): Promise<any[]> {
    const posts: any[] = []
    const author = users[0]
    const authorRel = author ? formatIdForRelationship(author.id) : null
    const sample = sampleMinimalPosts(authorRel)
    for (const p of sample) {
      try {
        const post = await this.payload.create({ collection: "posts", data: p as any, context: this.context })
        posts.push(post)
      } catch (error) {
        this.payload.logger.error("Error creating post:", error)
      }
    }
    return posts
  }

  // (Categories are not used in minimal starter)

  /*************************************************************************/
  /*  CREATE FORMS
  /*************************************************************************/

  private async seedForms(): Promise<any[]> {
    this.payload.logger.info("Seeding forms...")
    const formData = primaryContactForm()
    const form = await this.payload.create({
      collection: "forms",
      data: formData,
      context: this.context,
    })
    return [form]
  }

  // (Testimonials are not used in minimal starter)

  // (Templates are not used in minimal starter)

  // (Media seeding is not used in minimal starter)

  // (Posts are not used in minimal starter)

  // (Services are not used in minimal starter)

  /*************************************************************************/
  /*  CREATE MINIMAL PAGES
  /*************************************************************************/

  private async seedMinimalPages(forms: any[]): Promise<any[]> {
    this.payload.logger.info("Seeding minimal pages (blank pages)...")
    const pages = []
    
    const contactForm = forms?.[0]
    const pageData = await minimalPages(this.payload, this.context, contactForm)
    
    for (const data of pageData) {
      try {
        const page = await this.payload.create({
          collection: "pages",
          data,
          context: this.context,
        })
        pages.push(page)
      } catch (error) {
        this.payload.logger.error("Error creating minimal page:", error)
      }
    }
    
    return pages
  }

  // (Demo pages are not used in minimal starter)

  /*************************************************************************/
  /*  CREATE INITIAL NAVIGATION GLOBALS
  /*************************************************************************/

  private async seedGlobals(pages: any[]): Promise<any[]> {
    this.payload.logger.info("Seeding navigation globals (minimal profile)...")
    const globals = []

    try {
      const headerData = minimalHeaderGlobal()
      if (this.blogEnabled) {
        try {
          const insights = pages.find(p => p.slug === "insights")
          if (insights) {
            headerData.navItems.splice(1, 0, {
              item: {
                link: { type: "custom", newTab: false, url: "/insights", label: "Insights" },
                subItems: [],
              },
            })
          }
        } catch {}
      }
        
      const header = await this.payload.updateGlobal({
        slug: "header",
        data: headerData,
        context: this.context,
      })
      // Explicitly revalidate header cache tag since hooks may be disabled during seed
      try {
        const { revalidateTag } = await import("next/cache")
        revalidateTag("global:header")
        this.payload.logger.info("Revalidated global:header after seed")
      } catch (error) {
        this.payload.logger.error("Failed to revalidate global:header:", error)
      }
      globals.push(header)
    } catch (error) {
      this.payload.logger.error("Error creating header:", error)
    }

    try {
      const footerData = minimalFooterGlobal()

      // Mirror primary header links into a simple footer menu
      try {
        const homeLink = { type: "custom", newTab: false, url: "/", label: "Home" }
        const contactLink = { type: "custom", newTab: false, url: "/contact", label: "Contact" }
        const links = [homeLink]
        if (this.blogEnabled) {
          links.push({ type: "custom", newTab: false, url: "/insights", label: "Insights" })
        }
        links.push(contactLink)

        footerData.menus = [
          {
            title: "Explore",
            menuItems: links.map(link => ({ link })),
          },
        ]
      } catch {}

      const footer = await this.payload.updateGlobal({
        slug: "footer",
        data: footerData,
        context: this.context,
      })
      // Explicitly revalidate footer cache tag since hooks may be disabled during seed
      try {
        const { revalidateTag } = await import("next/cache")
        revalidateTag("global:footer")
        this.payload.logger.info("Revalidated global:footer after seed")
      } catch (error) {
        this.payload.logger.error("Failed to revalidate global:footer:", error)
      }
      globals.push(footer)
    } catch (error) {
      this.payload.logger.error("Error creating footer:", error)
    }

    return globals
  }

  /*************************************************************************/
  /*  CREATE SETTINGS GLOBAL
  /*************************************************************************/

  private async createSettingsGlobal(pages: any[]): Promise<void> {
    this.payload.logger.info("Creating settings global (minimal profile)...")

    try {
      // Find the required pages from the created pages
      const homePage = pages.find(p => p.slug === "home") || pages[0]
      const insightsPage = pages.find(p => p.slug === "insights")
      
      const settingsData: any = minimalSettingsGlobal(homePage)
      if (this.blogEnabled && insightsPage) {
        settingsData.routing = {
          ...(settingsData.routing || {}),
          postsCollectionLabel: "Insights",
          postsArchivePage: insightsPage.id,
          postsSingleTemplate: this.postTemplateId ? this.postTemplateId : null,
        }
      }
      await this.payload.updateGlobal({ slug: "settings", data: settingsData, context: this.context })
      
      this.payload.logger.info("Settings global created with routing configuration")
    } catch (error) {
      this.payload.logger.error("Error creating settings global:", error)
    }
  }

  /*************************************************************************/
  /*  UPDATE NAVIGATION GLOBALS
  /*************************************************************************/

  // (Navigation enrichment not needed in minimal starter)

  /*************************************************************************/
  /*  DELETE DATA METHODS
  /*************************************************************************/

  async deleteData(
    preserveUsers: boolean = true,
    manageHooks: boolean = true
  ): Promise<SeedResult> {
    const startTime = Date.now()
    const stats = { created: {} as Record<string, number>, errors: [] as string[] }

    try {
      this.payload.logger.info("Deleting existing data...")

      if (manageHooks) {
        disableSyncHooks(this.payload, this.context)
      }

      await this.cleanupLocalMediaFiles()
      await this.deleteMediaFiles()

      const collections = [
        "pages",
        "posts",
        "services",
        "categories",
        "forms",
        "testimonials",
        "templates",
        "redirects",
        "form-submissions",
        "uri-index",
      ]
      if (!preserveUsers) {
        collections.push("users")
      }

      for (const collection of collections) {
        try {
          let page = 1
          let hasNextPage = true
          let totalDeleted = 0

          while (hasNextPage) {
            let items
            try {
              items = await this.payload.find({
                collection: collection as any,
                limit: 100, // Process in smaller batches
                page,
                context: this.context,
              })
            } catch (findError) {
              // Collection doesn't exist - nothing to delete
              this.payload.logger.info(
                `Collection ${collection} doesn't exist, skipping deletion`
              )
              break
            }

            if (items.docs.length === 0) {
              hasNextPage = false
              break
            }

            // Delete items in the current page
            for (const item of items.docs) {
              try {
                if (
                  collection === "users" &&
                  (
                    (typeof process.env.AI_AGENT_USER_ID === "string" && String(item.id) === process.env.AI_AGENT_USER_ID) ||
                    (typeof (item as any).role === "string" && (item as any).role === "ai-agent")
                  )
                ) {
                  continue
                }
                await this.payload.delete({
                  collection: collection as any,
                  id: item.id,
                  context: this.context,
                })
                totalDeleted++
              } catch (deleteError) {
                this.payload.logger.error(
                  `Failed to delete ${collection} item ${item.id}:`,
                  deleteError
                )
              }
            }

            hasNextPage = items.hasNextPage
            page++
          }

          if (totalDeleted > 0) {
            this.payload.logger.info(`Deleted ${totalDeleted} items from ${collection}`)
          }
          stats.created[collection] = totalDeleted
        } catch (error) {
          this.payload.logger.info(
            `Collection ${collection} doesn't exist or couldn't be accessed, skipping`
          )
        }
      }

      this.mediaFiles.clear()

      await this.cleanupSystemCollections()

      this.payload.logger.info("Data deletion process completed successfully")

      if (manageHooks) {
        enableSyncHooks(this.payload, this.context)
      }

      const duration = Date.now() - startTime
      return {
        success: true,
        message: "Data deletion completed",
        stats,
        duration,
      }
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      stats.errors.push(errorMessage)

      this.payload.logger.error("Data deletion failed:", error)

      /**
       * Always re-enable hooks in case of error
       */
      try {
        if (manageHooks) {
          enableSyncHooks(this.payload, this.context)
        }
      } catch (disableError) {
        this.payload.logger.error(
          "Failed to re-enable hooks after deletion error:",
          disableError
        )
      }

      return {
        success: false,
        message: `Data deletion failed: ${errorMessage}`,
        stats,
        duration,
      }
    }
  }

  /*************************************************************************/
  /*  LOCAL MEDIA FILE CLEANUP
  /*
  /*  This method cleans up physical media files from the public/media folder
  /*  when using local storage instead of Vercel blob storage.
  /*  It prevents media files from building up during development.
  /*************************************************************************/

  private async cleanupLocalMediaFiles(): Promise<void> {
    try {
      // Get the public/media path relative to the project root
      const publicMediaPath = path.join(process.cwd(), "public", "media")

      this.payload.logger.info(`Checking for local media files in: ${publicMediaPath}`)

      // Check if the media directory exists
      try {
        await fs.access(publicMediaPath)
      } catch (error) {
        this.payload.logger.info("No public/media directory found, skipping cleanup")
        return
      }

      // Get all files in the media directory
      const mediaFiles = await fs.readdir(publicMediaPath)

      if (mediaFiles.length === 0) {
        this.payload.logger.info("No media files found in public/media directory")
        return
      }

      this.payload.logger.info(`Found ${mediaFiles.length} local media files to clean up`)

      let deletedFiles = 0
      let errors = 0

      // Delete each file
      for (const file of mediaFiles) {
        try {
          const filePath = path.join(publicMediaPath, file)
          const stats = await fs.stat(filePath)

          if (stats.isFile()) {
            await fs.unlink(filePath)
            deletedFiles++
            this.payload.logger.debug(`Deleted local media file: ${file}`)
          } else if (stats.isDirectory()) {
            // If there are subdirectories, recursively clean them
            await this.cleanupDirectory(filePath)
            deletedFiles++
            this.payload.logger.debug(`Deleted local media directory: ${file}`)
          }
        } catch (error) {
          this.payload.logger.error(`Failed to delete local media file ${file}:`, error)
          errors++
        }
      }

      this.payload.logger.info(
        `Local media cleanup completed: ${deletedFiles} files/directories deleted, ${errors} errors`
      )
    } catch (error) {
      this.payload.logger.error("Error during local media file cleanup:", error)
      // Don't throw the error as this is cleanup - continue with seeding
    }
  }

  /*************************************************************************/
  /*  RECURSIVE DIRECTORY CLEANUP
  /*************************************************************************/

  private async cleanupDirectory(dirPath: string): Promise<void> {
    try {
      const items = await fs.readdir(dirPath)

      for (const item of items) {
        const itemPath = path.join(dirPath, item)
        const stats = await fs.stat(itemPath)

        if (stats.isDirectory()) {
          await this.cleanupDirectory(itemPath)
        } else {
          await fs.unlink(itemPath)
        }
      }

      // Remove the empty directory
      await fs.rmdir(dirPath)
    } catch (error) {
      this.payload.logger.error(`Failed to cleanup directory ${dirPath}:`, error)
    }
  }

  /*************************************************************************/
  /*  MEDIA FILE DELETION
  /*************************************************************************/

  private async deleteMediaFiles(): Promise<void> {
    try {
      this.payload.logger.info("Deleting media files...")

      let page = 1
      let hasNextPage = true
      let totalDeleted = 0
      let totalErrors = 0

      while (hasNextPage) {
        const mediaItems = await this.payload.find({
          collection: "media",
          limit: 100, // Process in smaller batches
          page,
          context: this.context,
        })

        if (mediaItems.docs.length === 0) {
          hasNextPage = false
          break
        }

        for (const mediaItem of mediaItems.docs) {
          try {
            this.payload.logger.info(
              `Attempting to delete media item ${mediaItem.id}: ${mediaItem.filename}`
            )

            await this.payload.delete({
              collection: "media",
              id: mediaItem.id,
              context: this.context,
            })

            this.payload.logger.info(`Successfully deleted media item ${mediaItem.id}`)
            totalDeleted++
          } catch (error) {
            this.payload.logger.error(
              `Failed to delete media item ${mediaItem.id} (${mediaItem.filename}):`,
              error instanceof Error ? error.message : String(error)
            )

            totalErrors++
          }
        }

        hasNextPage = mediaItems.hasNextPage
        page++

        this.payload.logger.info(
          `Processed page ${page - 1}: ${mediaItems.docs.length} items`
        )
      }

      this.payload.logger.info(
        `Media deletion completed: ${totalDeleted} deleted, ${totalErrors} errors`
      )
    } catch (error) {
      this.payload.logger.error("Error during media file deletion:", error)
      throw error
    }
  }

  /*************************************************************************/
  /*  SYSTEM COLLECTIONS CLEANUP
  /*************************************************************************/

  private async cleanupSystemCollections(): Promise<void> {
    try {
      this.payload.logger.info("Cleaning up system collections...")

      const systemCollections = [
        "payload-locked-documents",
        "payload-preferences",
        "payload-migrations",
        "search",
      ]

      for (const collection of systemCollections) {
        try {
          let page = 1
          let hasNextPage = true
          let totalDeleted = 0

          while (hasNextPage) {
            const items = await this.payload.find({
              collection: collection as any,
              limit: 100,
              page,
              context: this.context,
            })

            if (items.docs.length === 0) {
              hasNextPage = false
              break
            }

            for (const item of items.docs) {
              try {
                await this.payload.delete({
                  collection: collection as any,
                  id: item.id,
                  context: this.context,
                })
                totalDeleted++
              } catch (deleteError) {
                // Silently continue on system collection errors as some may not exist or may be protected
              }
            }

            hasNextPage = items.hasNextPage
            page++
          }

          if (totalDeleted > 0) {
            this.payload.logger.info(
              `Cleaned up ${totalDeleted} items from ${collection}`
            )
          }
        } catch (error) {
          this.payload.logger.debug(
            `System collection ${collection} cleanup skipped:`,
            error
          )
        }
      }

      this.payload.logger.info("System collections cleanup completed")
    } catch (error) {
      this.payload.logger.warn("System collections cleanup encountered issues:", error)
    }
  }
}

/*************************************************************************/
/*  EXPORTED FUNCTIONS
/*************************************************************************/

export { DynamicSeedManager }
export type { SeedResult }
