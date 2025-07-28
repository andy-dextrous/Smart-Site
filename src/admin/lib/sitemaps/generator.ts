import { cache } from "@/admin/lib/cache"
import { getServerSideURL } from "@/admin/utilities/get-url"
import { getSitemapConfig } from "./config"
import {
  createSitemapEntry,
  filterDocumentsForSitemap,
  getSEOFieldSelection,
  type SitemapEntry,
} from "./seo-filters"

export interface GenerateSitemapOptions {
  collectionName: string // Required - collection to generate sitemap for
  siteUrl?: string
  includeStatic?: boolean
}

export interface SitemapGenerationResult {
  entries: SitemapEntry[]
  collection: string
  totalCount: number
  filteredCount: number
}

/*************************************************************************/
/*  UNIVERSAL SITEMAP GENERATOR
/*************************************************************************/

export async function generateSitemap(
  options: GenerateSitemapOptions
): Promise<SitemapGenerationResult> {
  const { collectionName } = options
  const siteUrl = getServerSideURL()
  const config = getSitemapConfig(collectionName)

  /**
   * Fetch documents directly from cache with SEO field selection
   */
  const allDocuments = await cache.getCollection(collectionName as any, {
    select: getSEOFieldSelection(),
    depth: 0,
    limit: 10000,
  })

  const totalCount = allDocuments.length

  const seoFilteredDocs = filterDocumentsForSitemap(allDocuments)
  const filteredCount = seoFilteredDocs.length

  const entries = seoFilteredDocs.map(doc => {
    return createSitemapEntry(doc, siteUrl, config.priority, config.changeFreq)
  })

  entries.sort((a, b) => {
    const priorityDiff = (b.priority || 0.5) - (a.priority || 0.5)
    if (priorityDiff !== 0) return priorityDiff

    return new Date(b.lastmod).getTime() - new Date(a.lastmod).getTime()
  })

  return {
    entries,
    collection: collectionName,
    totalCount,
    filteredCount,
  }
}
