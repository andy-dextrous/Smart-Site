/*************************************************************************/
/*  SITEMAPS MODULE - MAIN EXPORTS
/*************************************************************************/

// Configuration
export {
  getSitemapConfig,
  shouldIncludeCollectionInSitemap,
  getSitemapCacheTags,
  getFrontendCollectionKeys,
  type SitemapConfig,
  type SitemapCollectionConfig,
} from "@/lib/sitemaps/config"

// Generation
export {
  generateSitemap,
  type SitemapGenerationResult,
} from "@/lib/sitemaps/generator"

// SEO Filters
export {
  filterDocumentsForSitemap,
  createSitemapEntry,
  shouldIncludeInSitemap as shouldIncludeDocumentInSitemap,
  getSEOFieldSelection,
  type SitemapEntry,
  type SitemapDocumentFields as DocumentForSEO,
} from "@/lib/sitemaps/seo-filters"

// URL Utilities
export { isExternalUrl } from "@/lib/url-helpers"
