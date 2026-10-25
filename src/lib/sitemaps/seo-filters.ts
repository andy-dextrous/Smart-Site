import { isExternalUrl } from "@/lib/url-helpers"

export interface SitemapDocumentFields {
  uri: string
  _status: string
  collection?: string
  seo?: {
    meta?: {
      noIndex?: boolean | null
      canonicalUrl?: string | null
    }
  }
}

export interface SitemapEntry {
  loc: string
  lastmod: string
  priority?: number
  changefreq?: string
}

/*************************************************************************/
/*  SEO FILTERING FUNCTIONS
/*************************************************************************/

/**
 * Check if a document should be included in sitemaps based on SEO settings
 */
export function shouldIncludeInSitemap(doc: SitemapDocumentFields): boolean {
  const status = doc._status ?? "published"

  if (status !== "published") {
    return false
  }

  if (!doc.uri || doc.uri.trim() === "") {
    return false
  }

  const noIndex = doc.seo?.meta?.noIndex
  if (noIndex === true) {
    return false
  }

  const canonicalUrl = doc.seo?.meta?.canonicalUrl
  if (canonicalUrl && isExternalUrl(canonicalUrl)) {
    return false
  }

  return true
}

/**
 * Get the effective canonical URL for a document
 */
export function getCanonicalUrl(doc: SitemapDocumentFields, siteUrl: string): string {
  const canonicalUrl = doc.seo?.meta?.canonicalUrl

  const resolveInternal = (path: string) => {
    if (!path.startsWith("/")) {
      return `/${path}`
    }

    return path
  }

  if (canonicalUrl && isExternalUrl(canonicalUrl)) {
    return canonicalUrl
  }

  if (canonicalUrl && canonicalUrl.startsWith("/")) {
    return `${siteUrl}${canonicalUrl}`
  }

  const resolvedUri = resolveInternal(doc.uri || "/")

  return `${siteUrl}${resolvedUri}`
}

/**
 * Filter documents for sitemap inclusion with SEO compliance
 */
export function filterDocumentsForSitemap<T extends SitemapDocumentFields>(
  documents: T[]
): T[] {
  return documents.filter(shouldIncludeInSitemap)
}

/**
 * Get SEO-compliant sitemap entry for a document
 */

export function createSitemapEntry(
  doc: SitemapDocumentFields,
  siteUrl: string,
  priority?: number,
  changefreq?: string
): SitemapEntry {
  const entry: SitemapEntry = {
    loc: getCanonicalUrl(doc, siteUrl),
    lastmod: (doc as any).updatedAt || new Date().toISOString(),
  }

  if (priority !== undefined) {
    entry.priority = priority
  }

  if (changefreq) {
    entry.changefreq = changefreq
  }

  return entry
}

/*************************************************************************/
/*  UTILITY FUNCTIONS FOR PAYLOAD FIELD SELECTION
/*************************************************************************/

/**
 * Get required fields for SEO filtering (use this in cache queries)
 */
export function getSEOFieldSelection() {
  return {
    uri: true,
    _status: true,
    updatedAt: true,
    "seo.meta.noIndex": true,
    "seo.meta.canonicalUrl": true,
  }
}
