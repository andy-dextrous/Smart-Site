import { getFrontendCollections } from "@/lib/collections"
import site from "@/site.config"

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

export async function getFrontendCollectionKeys(): Promise<string[]> {
  if (!site.features.sitemaps) return []
  return (await getFrontendCollections())
    .filter(item => item.sitemap?.enabled !== false)
    .map(item => item.slug)
}

export async function getSitemapConfig(
  collection: string
): Promise<SitemapCollectionConfig> {
  const entry = (await getFrontendCollections()).find(item => item.slug === collection)
  const config = entry?.sitemap
  if (!config) return DEFAULT_SITEMAP_CONFIG
  return {
    respectSEO: config.respectNoIndex,
    priority: config.priority,
    changeFreq: config.changefreq,
    includeInIndex: config.enabled,
  }
}

export async function shouldIncludeCollectionInSitemap(
  collection: string
): Promise<boolean> {
  return (await getFrontendCollectionKeys()).includes(collection)
}

export async function getSitemapCacheTags(collection: string): Promise<string[]> {
  const tags: string[] = []

  if (await shouldIncludeCollectionInSitemap(collection)) {
    tags.push(`sitemap:${collection}`)
    tags.push("sitemap:all")
  }

  return tags
}
