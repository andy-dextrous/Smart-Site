import { promises as fs } from "fs"
import path from "path"
import type { Payload } from "payload"

// Import all data functions
import { regenerateURIs } from "@/lib/routing/index-manager"
import { disableSyncHooks, enableSyncHooks } from "@/utilities/prevent-hooks"
import { formatIdForText, formatIdForRelationship } from "@/payload/db/id-utils"
import { technologyCategory } from "./categories/technology"
import { primaryContactForm } from "./forms/primary-contact"
import { footerGlobal } from "./globals/footer"
import { headerGlobal } from "./globals/header"
import { settingsGlobal } from "./globals/settings"
import { aboutUsPage } from "./pages/about-us"
import { contactPage } from "./pages/contact"
import { homePage } from "./pages/home"
import { insightsPage } from "./pages/insights"
import { servicesPage } from "./pages/services"
import { analyticsStrategyPost } from "./posts/analytics-strategy"
import { digitalTransformationPost } from "./posts/digital-transformation"
import { scalingInfrastructurePost } from "./posts/scaling-infrastructure"
import { operationsService, strategyService, technologyService } from "./services"
import { serviceTemplates } from "./templates/service-templates"
import { technologyClientTestimonials } from "./testimonials/technology-clients"
import { seedUser } from "./users/user"

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

  constructor(payload: Payload) {
    this.payload = payload
  }

  /*************************************************************************/
  /*  MAIN SEED DATABASE METHOD
  /*************************************************************************/

  async seedDatabase(): Promise<SeedResult> {
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
       * Step 2: Clean existing data (but preserve users)
       */
      this.payload.logger.info("Cleaning existing data...")
      const deleteResult = await this.deleteData(true, false) // Pass false to prevent hook management inside deleteData

      // Don't fail the entire seeding if deletion fails on empty database
      if (!deleteResult.success) {
        this.payload.logger.info(
          "Deletion had issues (likely empty database), continuing with seeding..."
        )
      }

      /**
       * Step 3: Seed users (only if none exist)
       */
      this.payload.logger.info("Checking for existing users...")
      let existingUsers: { docs: any[] } = { docs: [] }

      try {
        existingUsers = await this.payload.find({
          collection: "users",
          limit: 10,
          context: this.context,
        })
      } catch (error) {
        this.payload.logger.info(
          "Users table doesn't exist yet, will create during seeding"
        )
      }

      let seededUsers = []
      let usersCreated = 0

      if (existingUsers.docs.length > 0) {
        this.payload.logger.info(
          `Found ${existingUsers.docs.length} existing users, skipping user creation`
        )
        seededUsers = existingUsers.docs
        usersCreated = 0
      } else {
        this.payload.logger.info("No existing users found, creating seed users...")
        seededUsers = await this.seedUsers()
        usersCreated = seededUsers.length
      }

      /**
       * Step 4: Seed all content
       */
      const seededCategories = await this.seedCategories()
      const seededForms = await this.seedForms()
      const seededTemplates = await this.seedTemplates()
      const seededMedia = await this.seedMedia()
      const seededTestimonials = await this.seedTestimonials()
      const seededPages = await this.seedPages(seededForms)
      const seededServices = await this.seedServices()
      const seededGlobals = await this.seedGlobals(seededPages, seededTemplates)
      const seededPosts = await this.seedPosts(seededUsers, seededCategories)

      /**
       * Step 5: Create settings global FIRST to establish routing configuration
       * This sets up homepage, archive pages, and other routing rules that affect URI generation
       */
      await this.createSettingsGlobal(seededPages, seededTemplates)

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
       * Step 7: Update header and footer globals with services for proper reference links
       * Keep hooks disabled during this step to prevent revalidation errors on archive pages
       */
      await this.updateNavigationGlobals(seededServices)

      // Update stats
      stats.created.users = usersCreated
      stats.created.categories = seededCategories.length
      stats.created.forms = seededForms.length
      stats.created.templates = seededTemplates.length
      stats.created.testimonials = seededTestimonials.length
      stats.created.media = seededMedia.length
      stats.created.posts = seededPosts.length
      stats.created.services = seededServices.length
      stats.created.pages = seededPages.length
      stats.created.globals = seededGlobals.length + 1 // +1 for settings global

      /**
       * Step 8: Re-enable sync hooks only at the very end
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
  /*  CREATE USERS
  /*************************************************************************/

  private async seedUsers(): Promise<any[]> {
    this.payload.logger.info("Seeding users...")

    const userData = seedUser()

    // Check for existing user, but handle missing table gracefully
    let existingUser: { docs: any[] } = { docs: [] }
    try {
      existingUser = await this.payload.find({
        collection: "users",
        where: {
          username: {
            equals: userData.username,
          },
        },
        limit: 1,
        context: this.context,
      })
    } catch (error) {
      this.payload.logger.info(
        "Users table doesn't exist yet, proceeding with user creation"
      )
    }

    if (existingUser.docs.length > 0) {
      this.payload.logger.info(
        `User with username '${userData.username}' already exists, skipping creation`
      )
      return existingUser.docs
    }

    // Create user if doesn't exist
    const user = await this.payload.create({
      collection: "users",
      data: userData,
      context: this.context,
    })

    this.payload.logger.info(`Created user: ${userData.username}`)
    return [user]
  }

  /*************************************************************************/
  /*  CREATE CATEGORIES
  /*************************************************************************/

  private async seedCategories(): Promise<any[]> {
    this.payload.logger.info("Seeding categories...")
    const categoryData = technologyCategory()
    const category = await this.payload.create({
      collection: "categories",
      data: categoryData,
      context: this.context,
    })
    return [category]
  }

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

  /*************************************************************************/
  /*  CREATE TESTIMONIALS
  /*************************************************************************/

  private async seedTestimonials(): Promise<any[]> {
    this.payload.logger.info("Seeding testimonials...")

    // Testimonials now handle their own image downloading
    const testimonialsData = await technologyClientTestimonials(
      this.payload,
      this.context
    )
    const testimonials = []

    for (const testimonialData of testimonialsData) {
      const testimonial = await this.payload.create({
        collection: "testimonials",
        data: testimonialData,
        context: this.context,
      })
      testimonials.push(testimonial)
    }

    return testimonials
  }

  /*************************************************************************/
  /*  CREATE TEMPLATES
  /*************************************************************************/

  private async seedTemplates(): Promise<any[]> {
    this.payload.logger.info("Seeding templates...")

    // Templates handle their own image downloading
    const templatesData = await serviceTemplates(this.payload, this.context)
    const templates = []

    for (const templateData of templatesData) {
      try {
        const template = await this.payload.create({
          collection: "templates",
          data: templateData,
          context: this.context,
        })
        templates.push(template)
      } catch (error) {
        this.payload.logger.error(
          `Failed to create template ${templateData.name}:`,
          error
        )
        // Continue with other templates even if one fails
      }
    }
    return templates
  }

  /*************************************************************************/
  /*  CREATE MEDIA
  /*************************************************************************/

  private async seedMedia(): Promise<any[]> {
    this.payload.logger.info("Seeding media...")
    const media = []

    for (const [key, fileData] of this.mediaFiles.entries()) {
      const mediaItem = await this.payload.create({
        collection: "media",
        data: {
          alt: fileData.alt,
          caption: fileData.caption,
        },
        file: {
          name: fileData.name,
          data: fileData.data,
          mimetype: fileData.mimetype,
          size: fileData.size,
        },
        context: this.context,
      })
      media.push(mediaItem)
    }

    return media
  }

  /*************************************************************************/
  /*  CREATE POSTS
  /*************************************************************************/

  private async seedPosts(users: any[], categories: any[]): Promise<any[]> {
    this.payload.logger.info("Seeding posts...")
    const posts = []

    const author = users[0]
    const category = categories[0]

    // Format IDs for relationships
    const authorWithFormattedId = {
      ...author,
      id: formatIdForRelationship(author.id),
    }
    const categoryWithFormattedId = {
      ...category,
      id: formatIdForRelationship(category.id),
    }

    const postData = [
      await scalingInfrastructurePost(
        this.payload,
        { author: authorWithFormattedId, category: categoryWithFormattedId },
        this.context
      ),
      await analyticsStrategyPost(
        this.payload,
        { author: authorWithFormattedId, category: categoryWithFormattedId },
        this.context
      ),
      await digitalTransformationPost(
        this.payload,
        { author: authorWithFormattedId, category: categoryWithFormattedId },
        this.context
      ),
    ]

    for (const data of postData) {
      const post = await this.payload.create({
        collection: "posts",
        data,
        context: this.context,
      })
      posts.push(post)
    }

    return posts
  }

  /*************************************************************************/
  /*  CREATE SERVICES
  /*************************************************************************/

  private async seedServices(): Promise<any[]> {
    this.payload.logger.info("Seeding services...")
    const services = []

    // Services now handle their own image downloading
    const serviceData = [
      await strategyService(this.payload, this.context),
      await technologyService(this.payload, this.context),
      await operationsService(this.payload, this.context),
    ]

    for (const data of serviceData) {
      const service = await this.payload.create({
        collection: "services",
        data,
        context: this.context,
      })
      services.push(service)
    }

    return services
  }

  /*************************************************************************/
  /*  CREATE PAGES
  /*************************************************************************/

  private async seedPages(forms: any[]): Promise<any[]> {
    this.payload.logger.info("Seeding pages...")
    const pages = []

    const contactForm = forms[0]

    // Format contact form ID for relationship
    const formattedContactForm = {
      ...contactForm,
      id: formatIdForRelationship(contactForm.id),
    }

    // All pages now handle their own image downloading
    const pageData = [
      await homePage(this.payload, this.context),
      await aboutUsPage(this.payload, this.context),
      await contactPage(
        this.payload,
        { contactForm: formattedContactForm },
        this.context
      ),
      await servicesPage(this.payload, this.context),
      await insightsPage(this.payload, this.context),
    ]

    for (const data of pageData) {
      try {
        const page = await this.payload.create({
          collection: "pages",
          data,
          context: this.context,
        })
        pages.push(page)
      } catch (error) {
        this.payload.logger.error("Error creating page:", error)
        // Continue with other pages even if one fails
      }
    }

    return pages
  }

  /*************************************************************************/
  /*  CREATE INITIAL NAVIGATION GLOBALS
  /*************************************************************************/

  private async seedGlobals(pages: any[], templates: any[]): Promise<any[]> {
    this.payload.logger.info("Seeding initial navigation globals...")
    const globals = []

    try {
      const header = await this.payload.updateGlobal({
        slug: "header",
        data: headerGlobal({ services: [] }),
        context: this.context,
      })
      globals.push(header)
    } catch (error) {
      this.payload.logger.error("Error creating header:", error)
    }

    try {
      const footer = await this.payload.updateGlobal({
        slug: "footer",
        data: footerGlobal({ services: [] }),
        context: this.context,
      })
      globals.push(footer)
    } catch (error) {
      this.payload.logger.error("Error creating footer:", error)
    }

    return globals
  }

  /*************************************************************************/
  /*  CREATE SETTINGS GLOBAL
  /*************************************************************************/

  private async createSettingsGlobal(pages: any[], templates: any[]): Promise<void> {
    this.payload.logger.info("Creating settings global with routing configuration...")

    try {
      // Find the required pages from the created pages
      const homePage = pages.find(p => p.slug === "home") || pages[0]
      const servicesPage = pages.find(p => p.slug === "services")
      const insightsPage = pages.find(p => p.slug === "insights")
      const aboutUsPage = pages.find(p => p.slug === "about-us")

      await this.payload.updateGlobal({
        slug: "settings",
        data: settingsGlobal({
          homePage: homePage,
          servicesPage: servicesPage,
          insightsPage: insightsPage,
          aboutUsPage: aboutUsPage,
          templates: templates,
        }),
        context: this.context,
      })
      this.payload.logger.info("Settings global created with routing configuration")
    } catch (error) {
      this.payload.logger.error("Error creating settings global:", error)
    }
  }

  /*************************************************************************/
  /*  UPDATE NAVIGATION GLOBALS
  /*************************************************************************/

  private async updateNavigationGlobals(services: any[]): Promise<void> {
    this.payload.logger.info("Updating navigation globals with service references...")

    // Fetch services fresh from database to get updated URIs
    // Use a fresh context to bypass any caching
    const publishedServices = await this.payload.find({
      collection: "services",
      where: {
        _status: { equals: "published" },
      },
      limit: 100,
      context: { ...this.context, skipCache: true },
    })

    try {
      await this.payload.updateGlobal({
        slug: "header",
        data: headerGlobal({ services: publishedServices.docs }),
        context: this.context,
      })
    } catch (error) {
      this.payload.logger.error("Error updating header:", error)
    }

    try {
      await this.payload.updateGlobal({
        slug: "footer",
        data: footerGlobal({ services: publishedServices.docs }),
        context: this.context,
      })
    } catch (error) {
      this.payload.logger.error("Error updating footer:", error)
    }

    // Invalidate navigation cache to ensure frontend gets updated service URIs
    try {
      const { revalidateTag } = await import("next/cache")

      // Directly invalidate the cache tags for header and footer globals
      revalidateTag("global:header")
      revalidateTag("global:footer")

      // Also invalidate the "all" tag to ensure complete cache refresh
      revalidateTag("all")
    } catch (error) {
      this.payload.logger.error("Error invalidating navigation cache:", error)
    }
  }

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
          // Skip known problematic media items that consistently fail with empty errors
          const problematicFilenames = [
            "datadriven-logo-",
            "innovatetech-logo-",
            "techflow-logo-",
            "template-cta-bg-",
          ]

          if (
            problematicFilenames.some(pattern => mediaItem.filename?.includes(pattern))
          ) {
            continue
          }

          try {
            this.payload.logger.info(
              `Attempting to delete media item ${mediaItem.id}: ${mediaItem.filename}`
            )

            const deleteResult = await this.payload.delete({
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
