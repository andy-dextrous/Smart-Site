import { cache } from "@/website/cache"
import type { PaginatedResult } from "@/website/cache/cache"
import { getFrontendCollections } from "@/website/collections"
import { routingEngine } from "@/website/routing"
import configPromise from "@payload-config"
import { getSearchConfig } from "@/website/features"

// The optional search plugin disappears from generated types when disabled.
// This is the stable projection consumed by the website, not its full schema.
interface SearchDocument {
  id: string
  title?: string | null
  slug?: string | null
  uri?: string | null
  doc?: { relationTo: string } | null
  meta?: { description?: string | null } | null
  categories?: Array<{ id?: string | null; title?: string | null }> | null
}

export interface SearchResultItem {
  id: string
  title: string
  description: string | null
  href: string
  collection: string
  collectionLabel: string
  slug: string | null
  categories: Array<{ id: string; title: string | null }>
}

export interface SearchResultSet {
  items: SearchResultItem[]
  page: number
  totalPages: number
  total: number
  query: string
  hasQuery: boolean
}

interface GetSearchResultsArgs {
  query?: string
  page?: number
  limit?: number
}

const QUERY_MIN_LENGTH = 2

function normalizeQuery(raw?: string | string[]): string {
  if (!raw) {
    return ""
  }

  const value = Array.isArray(raw) ? raw[0] : raw
  if (!value) {
    return ""
  }

  return value.trim().replace(/\s+/g, " ")
}

function buildWhere(query: string) {
  if (!query) {
    return {}
  }

  const tokens = query
    .split(/\s+/)
    .map(token => token.trim().toLowerCase())
    .filter(Boolean)

  if (tokens.length === 0) {
    return {}
  }

  return {
    and: tokens.map(token => ({
      searchText: { contains: token },
    })),
  }
}

function resolveHref(doc: SearchDocument, fallbackCollectionLabel: string): string {
  if (doc.uri) {
    return routingEngine.normalizeURI(doc.uri)
  }

  const relation = doc.doc && typeof doc.doc === "object" ? doc.doc.relationTo : null

  if (relation === "pages") {
    if (doc.slug) {
      return routingEngine.normalizeURI(`/${doc.slug}`)
    }
    return "/"
  }

  if (relation) {
    if (doc.slug) {
      return routingEngine.normalizeURI(`/${relation}/${doc.slug}`)
    }
    return routingEngine.normalizeURI(`/${relation}`)
  }

  if (doc.slug) {
    return routingEngine.normalizeURI(`/${doc.slug}`)
  }

  return "/"
}

function mapSearchDoc(
  doc: SearchDocument,
  collectionsMap: Record<string, { label: string }>
): SearchResultItem {
  const relation = doc.doc && typeof doc.doc === "object" ? doc.doc.relationTo : null
  const collectionLabel = relation
    ? collectionsMap[relation]?.label || relation
    : collectionsMap.pages?.label || "pages"

  const categories =
    doc.categories?.map(category => {
      return {
        id: category?.id || "",
        title: category?.title || null,
      }
    }) || []

  return {
    id: doc.id,
    title: doc.title || doc.slug || "Untitled",
    description: doc.meta?.description || null,
    href: resolveHref(doc, collectionLabel),
    collection: relation || "pages",
    collectionLabel,
    slug: doc.slug || null,
    categories,
  }
}

export async function getSearchResults(
  args: GetSearchResultsArgs = {}
): Promise<SearchResultSet> {
  const { query: rawQuery, page = 1, limit = 12 } = args
  const query = normalizeQuery(rawQuery)
  const hasQuery = query.length >= QUERY_MIN_LENGTH

  if (!hasQuery || !getSearchConfig().enabled) {
    return {
      items: [],
      page: 1,
      totalPages: 0,
      total: 0,
      query,
      hasQuery: false,
    }
  }

  // Native composition may intentionally omit the plugin even when presentation
  // still enables search. Never query a collection that is not registered.
  const searchCollection = (await configPromise).collections.find(
    collection => String(collection.slug) === "search"
  )
  if (!searchCollection) {
    return { items: [], page: 1, totalPages: 0, total: 0, query, hasQuery }
  }
  const where = buildWhere(query)

  const result = (await cache.getCollectionWithPagination(searchCollection.slug, {
    page,
    limit,
    sort: "-priority,-updatedAt",
    where,
    depth: 1,
    overrideAccess: false,
  })) as PaginatedResult<SearchDocument>

  const labels = Object.fromEntries(
    (await getFrontendCollections()).map(item => [item.slug, { label: item.label }])
  )
  const mapped = result.docs.map(doc => {
    return mapSearchDoc(doc, labels)
  })

  return {
    items: mapped,
    page: result.page,
    totalPages: result.totalPages,
    total: result.totalDocs,
    query,
    hasQuery,
  }
}
