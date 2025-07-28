import fs from "fs"
import path from "path"

/*************************************************************************/
/*  SITEMAP CONFIGURATION SYSTEM - TYPES & INTERFACES
/*************************************************************************/

export interface SitemapCollectionConfig {
  respectSEO: boolean
  priority: number
  changeFreq: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never"
  includeInIndex: boolean
}

export interface SitemapConfig {
  default: SitemapCollectionConfig
  [collection: string]: SitemapCollectionConfig
}

type FrontendCollection = {
  slug: string
  label: string
  hasSEO?: boolean
}

/*************************************************************************/
/*  SITEMAP CONFIGURATION OBJECT

    - Used to configure defaults and overrides for each collection's sitemap
    - By default, sitemaps work like Yoast where every frontend collection is included in its overflow-hidden sitemap
/*************************************************************************/

export const SITEMAP_CONFIG: SitemapConfig = {
  default: {
    respectSEO: true,
    priority: 0.8,
    changeFreq: "weekly",
    includeInIndex: true,
  },

  // Overrides per collection (optional)
  posts: {
    respectSEO: true,
    priority: 0.6,
    changeFreq: "weekly",
    includeInIndex: true,
  },
}

/*************************************************************************/
/*  FRONTEND COLLECTIONS -> SITEMAP CONFIG
/*************************************************************************/

export function getFrontendCollectionKeys(): string[] {
  try {
    let frontendCollections: FrontendCollection[] = []

    const jsonPath = path.join(
      process.cwd(),
      "src/admin/payload/collections/frontend/frontend-collections.json"
    )

    if (fs.existsSync(jsonPath)) {
      const jsonData = fs.readFileSync(jsonPath, "utf8")
      frontendCollections = JSON.parse(jsonData) as FrontendCollection[]
    }

    const collectionSlugs = frontendCollections.map(collection => collection.slug)

    return collectionSlugs.filter(collection => {
      const config = getSitemapConfig(collection)
      return config.includeInIndex
    })
  } catch (error) {
    console.warn("Failed to load frontend collections, using fallback:", error)
    return Object.keys(SITEMAP_CONFIG).filter(key => key !== "default")
  }
}

/*************************************************************************/
/*  CONFIG UTILITY FUNCTIONS
/*************************************************************************/

/**
 * Get sitemap configuration for a collection with fallback defaults
 * Auto-applies default config to any collection not explicitly configured
 */
export function getSitemapConfig(collection: string): SitemapCollectionConfig {
  return {
    ...SITEMAP_CONFIG.default,
    ...SITEMAP_CONFIG[collection],
  }
}

/**
 * Check if a collection should appear in sitemaps
 */
export function shouldIncludeCollectionInSitemap(collection: string): boolean {
  const config = getSitemapConfig(collection)
  return config.includeInIndex
}

/**
 * Get sitemap cache tags for a collection (integrates with universal cache)
 */
export function getSitemapCacheTags(collection: string): string[] {
  const tags: string[] = []

  if (shouldIncludeCollectionInSitemap(collection)) {
    tags.push(`sitemap:${collection}`)
    tags.push("sitemap:all")
  }

  return tags
}
