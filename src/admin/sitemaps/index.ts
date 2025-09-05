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
} from "./config"

// Generation
export { generateSitemap, type SitemapGenerationResult } from "./generator"

// SEO Filters
export {
  filterDocumentsForSitemap,
  createSitemapEntry,
  shouldIncludeInSitemap as shouldIncludeDocumentInSitemap,
  getSEOFieldSelection,
  type SitemapEntry,
  type SitemapDocumentFields as DocumentForSEO,
} from "./seo-filters"

// URL Utilities
export { isExternalUrl } from "@/admin/utilities/url-helpers"
