import { getFrontendCollections, getSmartSiteConfig } from "@/admin/config"

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

/*************************************************************************/
/*  FALLBACK DEFAULTS FOR COLLECTIONS WITHOUT SITEMAP CONFIG
/*************************************************************************/

const DEFAULT_SITEMAP_CONFIG: SitemapCollectionConfig = {
  respectSEO: true,
  priority: 0.7,
  changeFreq: "weekly",
  includeInIndex: true,
}

/*************************************************************************/
/*  FRONTEND COLLECTIONS -> SITEMAP CONFIG
/*************************************************************************/

export function getFrontendCollectionKeys(): string[] {
  const smartSiteConfig = getSmartSiteConfig()
  const frontendCollections = getFrontendCollections()
  const collectionSlugs = Object.keys(frontendCollections)

  return collectionSlugs.filter(slug => {
    const collectionConfig = smartSiteConfig.collections[slug]
    if (!collectionConfig?.sitemap) {
      return DEFAULT_SITEMAP_CONFIG.includeInIndex
    }
    return collectionConfig.sitemap.enabled !== false
  })
}

/*************************************************************************/
/*  CONFIG UTILITY FUNCTIONS
/*************************************************************************/

export function getSitemapConfig(collection: string): SitemapCollectionConfig {
  const smartSiteConfig = getSmartSiteConfig()
  const collectionConfig = smartSiteConfig.collections[collection]
  
  if (!collectionConfig?.sitemap) {
    return DEFAULT_SITEMAP_CONFIG
  }
  
  return {
    respectSEO: collectionConfig.sitemap.respectNoIndex ?? true,
    priority: collectionConfig.sitemap.priority,
    changeFreq: collectionConfig.sitemap.changefreq,
    includeInIndex: collectionConfig.sitemap.enabled
  }
}

export function shouldIncludeCollectionInSitemap(collection: string): boolean {
  const smartSiteConfig = getSmartSiteConfig()
  const collectionConfig = smartSiteConfig.collections[collection]
  
  if (!collectionConfig?.enabled || !collectionConfig?.frontend) {
    return false
  }
  
  if (!collectionConfig?.sitemap) {
    return DEFAULT_SITEMAP_CONFIG.includeInIndex
  }
  
  return collectionConfig.sitemap.enabled !== false
}

export function getSitemapCacheTags(collection: string): string[] {
  const tags: string[] = []

  if (shouldIncludeCollectionInSitemap(collection)) {
    tags.push(`sitemap:${collection}`)
    tags.push("sitemap:all")
  }

  return tags
}
