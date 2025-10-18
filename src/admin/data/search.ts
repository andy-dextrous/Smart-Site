import { cache } from "@/admin/cache"
import type { PaginatedResult } from "@/admin/cache/cache"
import { getSmartSiteConfig } from "@/admin/config"
import { routingEngine } from "@/admin/routing"
import type { Search } from "@/admin/payload/payload-types"

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

function resolveHref(doc: Search, fallbackCollectionLabel: string): string {
  if (doc.uri) {
    return routingEngine.normalizeURI(doc.uri)
  }

  const relation = typeof doc.doc === "object" ? doc.doc.relationTo : null

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
  doc: Search,
  collectionsMap: Record<string, { label: string }>
): SearchResultItem {
  const relation = typeof doc.doc === "object" ? doc.doc.relationTo : null
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

export async function getSearchResults(args: GetSearchResultsArgs = {}): Promise<SearchResultSet> {
  const { query: rawQuery, page = 1, limit = 12 } = args
  const query = normalizeQuery(rawQuery)
  const hasQuery = query.length >= QUERY_MIN_LENGTH

  if (!hasQuery) {
    return {
      items: [],
      page: 1,
      totalPages: 0,
      total: 0,
      query,
      hasQuery: false,
    }
  }

  const where = buildWhere(query)

  const result = (await cache.getCollectionWithPagination("search", {
    page,
    limit,
    sort: "-priority,-updatedAt",
    where,
    depth: 1,
    overrideAccess: false,
  })) as PaginatedResult<Search>

  const config = getSmartSiteConfig()
  const mapped = result.docs.map(doc => {
    return mapSearchDoc(doc, config.collections as Record<string, { label: string }>)
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
