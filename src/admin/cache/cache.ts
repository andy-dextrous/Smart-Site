import { getPayload } from "payload"
import { unstable_cache } from "next/cache"
import configPromise from "@payload-config"
import type { Config } from "@/admin/payload/payload-types"
import { isFrontendCollection } from "@/admin/config/frontend"
import { routingEngine } from "@/admin/routing/uri-engine"

/*************************************************************************/
/*  UNIVERSAL CACHE API - TYPES & INTERFACES
/*************************************************************************/

type Collection = keyof Config["collections"]
type Global = keyof Config["globals"]

// Simplified interface that matches what Payload's find method actually accepts
export interface QueryOptions {
  limit?: number
  page?: number
  sort?: string | string[]
  where?: any
  depth?: number
  draft?: boolean
  locale?: string
  overrideAccess?: boolean
  select?: Record<string, boolean>
}

export interface ResolvedDocument {
  document: any
  uriIndex: any
}

export interface CacheKeyOptions {
  collection?: string
  slug?: string
  uri?: string
  globalSlug?: string
  draft?: boolean
  queryHash?: string
  type?: string
  params?: string[]
}

export interface CacheOptions {
  tags?: string[]
  revalidate?: number
}

export interface PaginatedResult<T = any> {
  docs: T[]
  totalDocs: number
  totalPages: number
  page: number
}

/*************************************************************************/
/*  CACHE KEY GENERATION SYSTEM
/*************************************************************************/

function generateCacheKey(options: CacheKeyOptions): string[] {
  const {
    collection,
    slug,
    uri,
    globalSlug,
    draft,
    queryHash,
    type,
    params = [],
  } = options

  /**
   * Individual collection items by slug
   */
  if (collection && slug) {
    return [collection, "item", slug, draft ? "draft" : "published"]
  }

  /**
   * Individual collection items by ID
   */
  if (collection && params.length > 0 && !queryHash && !type) {
    return [collection, "item", params[0], draft ? "draft" : "published"]
  }

  /**
   * URI-based lookups (primary routing engine method)
   */
  if (uri !== undefined) {
    const normalizedURI = routingEngine.normalizeURI(uri)
    return ["uri", normalizedURI, draft ? "draft" : "published"]
  }

  /**
   * Collection queries with filters/pagination
   */
  if (collection && queryHash) {
    return [collection, "list", queryHash, draft ? "draft" : "published"]
  }

  /**
   * Global singletons
   */
  if (globalSlug) {
    return ["global", globalSlug]
  }

  /**
   * Computed/related content
   */
  if (type) {
    return ["computed", type, ...params]
  }

  throw new Error("Invalid cache key options provided")
}

/*************************************************************************/
/*  CACHE TAGS GENERATION

    CACHE KEYS vs CACHE TAGS:

    🔑 CACHE KEYS = Unique identifier for a specific cached item
       - Example: ["pages", "item", "about", "published"]
       - Used by Next.js to store/retrieve the exact cached value

    🏷️ CACHE TAGS = Labels for batch invalidation
       - Example: ["all", "collection:pages", "item:pages:about"]
       - Used by Next.js revalidateTag() to invalidate multiple cache entries
       - Multiple cache entries can share the same tag

    When you call revalidateTag("collection:pages"), it invalidates ALL
    cached items with that tag, regardless of their individual keys.

/*************************************************************************/

function generateCacheTags(options: CacheKeyOptions): string[] {
  const { collection, slug, uri, globalSlug, type, params = [] } = options
  const tags: string[] = []

  /*************************************************************************/
  /*  UNIVERSAL "ALL" TAG FOR EMERGENCY CACHE CLEARING

      This tag is added to EVERY cached item so that when revalidateTag("all")
      is called, it will clear ALL cached content across the entire site.

      Usage:
      - Emergency cache clearing via revalidateAll() function
      - Admin "Clear All Cache" buttons
      - Manual cache clearing in API routes

      NOTE: This tag should NEVER be used in everyday revalidation operations.
      It's only for manual clearing of the entire cache.
  /*************************************************************************/

  tags.push("all")

  /**
   * Individual items by slug
   */
  if (collection && slug) {
    tags.push(`collection:${collection}`)
    tags.push(`item:${collection}:${slug}`)

    /**
     * Add URI index tags for frontend collections
     */
    if (isFrontendCollection(collection)) {
      tags.push(`uri-index:${collection}`) // Specific collection in URI index
    }
  }

  /**
   * Individual items by ID (when params contains the ID)
   */
  if (collection && params.length > 0 && !slug && !type) {
    tags.push(`collection:${collection}`)
    tags.push(`item:${collection}:${params[0]}`)

    /**
     * Add URI index tags for frontend collections
     */
    if (isFrontendCollection(collection)) {
      tags.push(`uri-index:${collection}`) // Specific collection in URI index
    }
  }

  /**
   * URI-based lookups
   */
  if (uri !== undefined) {
    const normalizedURI = routingEngine.normalizeURI(uri)
    tags.push(`uri:${normalizedURI}`)
  }

  /**
   * Collection queries
   */
  if (collection && !slug && params.length === 0) {
    tags.push(`collection:${collection}`)

    /**
     * Add URI index tags for frontend collections
     */
    if (isFrontendCollection(collection)) {
      tags.push(`uri-index:${collection}`) // Specific collection in URI index
    }
  }

  /**
   * Globals
   */
  if (globalSlug) {
    tags.push(`global:${globalSlug}`)
  }

  /**
   * Computed/related content
   */
  if (type) {
    tags.push(`computed:${type}`)
  }

  return tags
}

/*************************************************************************/
/*  DEBUG LOGGING UTILITIES
/*************************************************************************/

interface CacheEvent {
  operation: string
  cacheKey: string[]
  tags: string[]
  timestamp: string
  hit?: boolean
}

function logCacheEvent(event: CacheEvent) {
  if (process.env.CACHE_DEBUG === "true") {
    const { operation, cacheKey, tags, hit } = event
    const status = hit !== undefined ? (hit ? "HIT" : "MISS") : "EXEC"

    // Use non-blocking logging to prevent circular dependencies
    setImmediate(async () => {
      const payload = await getPayload({ config: configPromise })
      payload.logger.info(
        `🗄️ [CACHE ${status}] ${operation} - tags: ${tags.join(", ")} - key: ${cacheKey.join(
          ","
        )}`
      )
    })
  }
}

/*************************************************************************/
/*  UNIVERSAL CACHE API

    Single interface for all content retrieval with intelligent caching and revalidation.

    Primary Methods:
    - cache.getByURI("/about/team/andrew")        → Universal routing (powers [[...slug]]/page.tsx)
    - cache.getBySlug("team", "andrew")           → Individual documents
    - cache.getCollection("team", {...})          → Filtered collections
    - cache.getGlobal("settings")                 → Site-wide content

    Each method wraps Next.js unstable_cache() with standardized keys, tags,
    and surgical invalidation for precise cache management.
/*************************************************************************/

export const cache = {
  /**
   * Get document by URI (primary method for universal routing)
   */
  getByURI: async (
    uri: string,
    draft: boolean = false
  ): Promise<ResolvedDocument | null> => {
    const cacheKey = generateCacheKey({ uri, draft })
    const tags = generateCacheTags({ uri })

    const timestamp = new Date().toISOString()
    logCacheEvent({ operation: `getByURI("${uri}")`, cacheKey, tags, timestamp })

    return unstable_cache(
      async () => {
        const payload = await getPayload({ config: configPromise })

        /**
         * Query 1: Fast URI index lookup (indexed, very fast)
         */
        const indexResult = await payload.find({
          collection: "uri-index",
          where: {
            and: [
              { uri: { equals: uri } },
              { status: { equals: draft ? "draft" : "published" } },
            ],
          },
          limit: 1,
        })

        if (indexResult.docs.length === 0) {
          return null
        }

        const indexDoc = indexResult.docs[0]

        /**
         * Query 2 & 3: Run document and template queries in parallel
         */
        const documentPromise = payload.findByID({
          collection: indexDoc.sourceCollection as any,
          id: indexDoc.documentId,
          draft,
          depth: 5,
          overrideAccess: true,
        })

        /**
         * Only fetch template if we have a templateId and document might need it
         */
        const templatePromise = indexDoc.templateId
          ? payload
              .findByID({
                collection: "templates",
                id: indexDoc.templateId,
                draft: false,
                depth: 2,
                overrideAccess: true,
              })
              .catch(() => null) // Gracefully handle template fetch failures
          : Promise.resolve(null)

        /**
         * Wait for both queries to complete
         */
        const [document, template] = await Promise.all([documentPromise, templatePromise])

        if (!document) {
          return null
        }

        /**
         * If document doesn't have sections and we have a template, apply template sections
         */
        if (
          (!document.sections || document.sections.length === 0) &&
          template?.sections
        ) {
          document.sections = template.sections
        }

        return {
          document,
          uriIndex: indexDoc,
        }
      },
      cacheKey,
      { tags }
    )()
  },

  /**
   * Get document by collection and ID
   */
  getByID: async (
    collection: Collection,
    id: string,
    draft: boolean = false
  ): Promise<any | null> => {
    const cacheKey = generateCacheKey({ collection, params: [id], draft })
    const tags = generateCacheTags({ collection, params: [id] })

    const timestamp = new Date().toISOString()
    logCacheEvent({
      operation: `getByID("${collection}", "${id}")`,
      cacheKey,
      tags,
      timestamp,
    })

    return unstable_cache(
      async () => {
        const payload = await getPayload({ config: configPromise })

        const result = await payload.findByID({
          collection,
          id,
          draft,
          depth: 5,
          overrideAccess: true,
        })

        return result || null
      },
      cacheKey,
      { tags }
    )()
  },

  /**
   * Get document by collection and slug
   */
  getBySlug: async (
    collection: Collection,
    slug: string,
    draft: boolean = false
  ): Promise<any | null> => {
    const cacheKey = generateCacheKey({ collection, slug, draft })
    const tags = generateCacheTags({ collection, slug })

    const timestamp = new Date().toISOString()
    logCacheEvent({
      operation: `getBySlug("${collection}", "${slug}")`,
      cacheKey,
      tags,
      timestamp,
    })

    return unstable_cache(
      async () => {
        const payload = await getPayload({ config: configPromise })

        const result = await payload.find({
          collection,
          draft,
          depth: 5,
          limit: 1,
          pagination: false,
          overrideAccess: true,
          where: {
            slug: {
              equals: slug,
            },
          },
        })

        return result.docs?.[0] || null
      },
      cacheKey,
      { tags }
    )()
  },

  /**
   * Get collection with query options
   */
  getCollection: async (
    collection: Collection,
    options: QueryOptions = {},
    draft: boolean = false
  ): Promise<any[]> => {
    const queryHash = JSON.stringify(options)
    const cacheKey = generateCacheKey({ collection, queryHash, draft })
    const tags = generateCacheTags({ collection })

    const timestamp = new Date().toISOString()
    logCacheEvent({
      operation: `getCollection("${collection}")`,
      cacheKey,
      tags,
      timestamp,
    })

    return unstable_cache(
      async () => {
        const payload = await getPayload({ config: configPromise })
        const {
          limit,
          page,
          sort,
          where,
          depth = 1,
          locale,
          overrideAccess = true,
        } = options || {}

        const query: any = {
          collection,
          draft,
          depth,
          overrideAccess,
        }

        Object.entries({ limit, page, sort, where, locale }).forEach(([key, value]) => {
          if (value !== undefined) query[key] = value
        })

        const result = await payload.find(query)

        return result.docs
      },
      cacheKey,
      { tags }
    )()
  },

  /**
   * Get collection with pagination metadata
   */
  getCollectionWithPagination: async (
    collection: Collection,
    options: QueryOptions = {},
    draft: boolean = false
  ): Promise<PaginatedResult> => {
    const queryHash = JSON.stringify({ ...options, includePagination: true })
    const cacheKey = generateCacheKey({ collection, queryHash, draft })
    const tags = generateCacheTags({ collection })

    const timestamp = new Date().toISOString()
    logCacheEvent({
      operation: `getCollectionWithPagination("${collection}")`,
      cacheKey,
      tags,
      timestamp,
    })

    return unstable_cache(
      async () => {
        const payload = await getPayload({ config: configPromise })
        const {
          limit,
          page,
          sort,
          where,
          depth = 1,
          locale,
          overrideAccess = true,
        } = options || {}

        const query: any = {
          collection,
          draft,
          depth,
          overrideAccess,
        }

        Object.entries({ limit, page, sort, where, locale }).forEach(([key, value]) => {
          if (value !== undefined) query[key] = value
        })

        const result = await payload.find(query)

        return {
          docs: result.docs,
          totalDocs: result.totalDocs,
          totalPages: result.totalPages,
          page: result.page || 1,
        }
      },
      cacheKey,
      { tags }
    )()
  },

  /**
   * Get global by slug
   */
  getGlobal: async (globalSlug: Global, depth: number = 0): Promise<any> => {
    const cacheKey = generateCacheKey({ globalSlug })
    const tags = generateCacheTags({ globalSlug })

    const timestamp = new Date().toISOString()
    logCacheEvent({
      operation: `getGlobal("${globalSlug}")`,
      cacheKey,
      tags,
      timestamp,
    })

    return unstable_cache(
      async () => {
        const payload = await getPayload({ config: configPromise })

        const result = await payload.findGlobal({
          slug: globalSlug,
          depth,
        })

        return result
      },
      cacheKey,
      { tags }
    )()
  },

  /**
   * Get all URIs for static generation (specialized URI index query)
   */
  getAllURIs: async (draft: boolean = false): Promise<string[]> => {
    const cacheKey = generateCacheKey({
      collection: "uri-index",
      type: "all-uris",
      params: [draft ? "draft" : "published"],
    })
    const tags = generateCacheTags({ collection: "uri-index" })

    const timestamp = new Date().toISOString()
    logCacheEvent({
      operation: `getAllURIs(${draft})`,
      cacheKey,
      tags,
      timestamp,
    })

    return unstable_cache(
      async () => {
        const payload = await getPayload({ config: configPromise })

        const result = await payload.find({
          collection: "uri-index",
          where: {
            status: { equals: draft ? "draft" : "published" },
          },
          limit: 2000,
          depth: 0,
          select: { uri: true },
        })

        const uris = result.docs.map((doc: any) => doc.uri).filter(Boolean)
        return [...new Set(uris)]
      },
      cacheKey,
      { tags }
    )()
  },

  /**
   * Get redirect by URI with caching
   */
  getRedirect: async (uri: string): Promise<any | null> => {
    const cacheKey = generateCacheKey({
      collection: "redirects",
      type: "redirect-lookup",
      params: [uri],
    })
    const tags = generateCacheTags({ collection: "redirects" })
    // Also tag with the specific URI for surgical invalidation
    tags.push(`redirect:${uri}`)

    const timestamp = new Date().toISOString()
    logCacheEvent({
      operation: `getRedirect("${uri}")`,
      cacheKey,
      tags,
      timestamp,
    })

    return unstable_cache(
      async () => {
        const payload = await getPayload({ config: configPromise })

        // Priority-based redirect lookup: Manual redirects win over automatic ones
        const manualRedirect = await payload.find({
          collection: "redirects",
          where: {
            and: [{ from: { equals: uri } }, { type: { equals: "manual" } }],
          },
          limit: 1,
          depth: 2,
        })

        if (manualRedirect.docs.length > 0) {
          return manualRedirect.docs[0]
        }

        // If no manual redirect found, look for automatic redirect
        const automaticRedirect = await payload.find({
          collection: "redirects",
          where: {
            and: [{ from: { equals: uri } }, { type: { equals: "automatic" } }],
          },
          limit: 1,
          depth: 2,
        })

        if (automaticRedirect.docs.length > 0) {
          return automaticRedirect.docs[0]
        }

        // Fallback to any redirect if type field doesn't exist (backward compatibility)
        const anyRedirect = await payload.find({
          collection: "redirects",
          where: {
            from: { equals: uri },
          },
          limit: 1,
          depth: 2,
        })

        return anyRedirect.docs.length > 0 ? anyRedirect.docs[0] : null
      },
      cacheKey,
      { tags }
    )()
  },
}
