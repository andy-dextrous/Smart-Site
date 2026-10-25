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
} from "@/website/sitemaps/config"

// Generation
export {
  generateSitemap,
  type SitemapGenerationResult,
} from "@/website/sitemaps/generator"

// SEO Filters
export {
  filterDocumentsForSitemap,
  createSitemapEntry,
  shouldIncludeInSitemap as shouldIncludeDocumentInSitemap,
  getSEOFieldSelection,
  type SitemapEntry,
  type SitemapDocumentFields as DocumentForSEO,
} from "@/website/sitemaps/seo-filters"

// URL Utilities
export { isExternalUrl } from "@/utilities/url-helpers"
