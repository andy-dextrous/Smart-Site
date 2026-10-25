import { MAX_PAGE_NODES } from "@/website/routing/limits"
import { checkURIConflict } from "@/website/routing/index-manager"
import configPromise from "@payload-config"
import { getPayload as loadPayload, type PayloadRequest } from "payload"

let currentGetPayload = loadPayload

export function setRoutingPayloadAccessor(getter?: typeof loadPayload): void {
  currentGetPayload = getter ?? loadPayload
}

function requestPayload(req: PayloadRequest, enforceAccess = false) {
  return new Proxy(req.payload, {
    get(target, key) {
      const value = Reflect.get(target, key)
      if (["find", "findByID", "findGlobal"].includes(String(key)))
        return (args: any) =>
          value.call(target, {
            ...args,
            req,
            ...(enforceAccess ? { overrideAccess: false } : {}),
          })
      return value
    },
  })
}

const RESERVED_URI_PREFIXES = ["/admin", "/api"]

function normalizeReservedURI(uri: string): string {
  if (!uri || uri === "/") {
    return uri || "/"
  }
  return uri.replace(/\/+$/, "")
}

export function isReservedURI(uri: string): boolean {
  const normalized = normalizeReservedURI(uri)
  const candidates = new Set<string>([normalized])

  const withoutLocale = normalized.replace(/^\/[^/]+/, "")
  if (withoutLocale.startsWith("/")) {
    candidates.add(withoutLocale)
  }

  for (const candidate of candidates) {
    if (
      RESERVED_URI_PREFIXES.some(
        prefix => candidate === prefix || candidate.startsWith(`${prefix}/`)
      )
    ) {
      return true
    }
  }

  return false
}

/*************************************************************************/
/*  URI ENGINE

    The URI Engine is the core component of the Smart Routing Engine that handles
    intelligent URI generation and validation for all frontend collections.

    KEY RESPONSIBILITIES:
    - Generate URIs for pages with hierarchical parent/child relationships
    - Generate URIs for collection items using archive page settings
    - Generate breadcrumbs for navigation (separate from URI generation)
    - Validate URI format and detect conflicts using the URI Index
    - Support WordPress-like routing with first-match-wins conflict resolution

    URI GENERATION RULES:
    - Homepage: Always "/" (determined by settings.routing.homepage)
    - Pages: Hierarchical paths based on parent relationships (/parent/child)
    - Collection Items: Use archive page slug or collection name (/blog/post-slug)
    - All URIs validated and checked for conflicts via URI Index Collection

    BREADCRUMB GENERATION RULES:
    - Pages: Build chain from root to current page using parent hierarchy
    - Collection Items: Include archive page in chain before current item
    - Homepage: Empty breadcrumbs array (no ancestors)
    - Current page: Always marked with isCurrentPage: true

    ARCHITECTURE INTEGRATION:
    - Uses cache for normal operations, direct database calls for hooks/jobs
    - Integrates with URI Index Collection for O(1) conflict detection
    - Supports smart revalidation through configuration-driven cache dependencies

/*************************************************************************/

export interface BreadcrumbItem {
  label: string
  uri: string
  isCurrentPage: boolean
}

type IndexDataMode = "uri" | "breadcrumbs" | "both"

interface IndexData {
  uri?: string
  breadcrumbs?: BreadcrumbItem[]
}

interface GenerateIndexDataProps {
  collection: string
  slug: string
  data?: any
  originalDoc?: any
  settings: any
  payload: any
  mode: IndexDataMode
}

/*************************************************************************/
/*  DOCUMENT INDEX DATA GENERATION (MAIN ROUTER)
/*************************************************************************/

async function generateDocumentIndexData({
  collection,
  slug,
  data,
  originalDoc,
  settings,
  payload,
  mode,
}: GenerateIndexDataProps): Promise<IndexData> {
  // In the Smart Site, Pages are a special collection. They are equivalent to "pages" in WordPress
  // All other frontend collections are treated as "custom post types" in WordPress

  const homepageId =
    typeof settings?.homepage === "object" ? settings.homepage?.id : settings?.homepage

  if (collection === "pages") {
    return await generatePageIndexData({
      slug,
      data,
      originalDoc,
      payload,
      mode,
      homepageId,
    })
  }

  return await generateCollectionIndexData({
    collection,
    slug,
    data,
    originalDoc,
    settings,
    payload,
    mode,
    homepageId,
  })
}

/*************************************************************************/
/*  PAGE INDEX DATA GENERATION (HIERARCHICAL)
/*************************************************************************/

async function generatePageIndexData({
  slug,
  data,
  originalDoc,
  payload,
  mode,
  homepageId,
  _visited = new Set<string>(), // Cycle detection
  _depth = 0, // Depth protection
}: {
  slug: string
  data?: any
  originalDoc?: any
  payload: any
  mode: IndexDataMode
  homepageId?: string | null
  _visited?: Set<string>
  _depth?: number
}): Promise<IndexData> {
  const parent = data && "parent" in data ? data.parent : originalDoc?.parent
  const title = data?.title || originalDoc?.title || slug
  const currentDocId = data?.id || originalDoc?.id || slug

  /**
   * INFINITE LOOP PROTECTION: Check for maximum depth
   */
  if (_depth >= MAX_PAGE_NODES) {
    throw new Error(`Page hierarchy exceeds ${MAX_PAGE_NODES} total pages`)
  }

  /**
   * INFINITE LOOP PROTECTION: Check for circular references
   */
  if (_visited.has(currentDocId)) {
    throw new Error(`Page hierarchy contains a cycle at ${slug}`)
  }

  // Add current document to visited set
  _visited.add(currentDocId)

  /**
   * Homepage special case
   */
  if (homepageId && String(currentDocId) === String(homepageId)) {
    _visited.delete(currentDocId) // Cleanup
    return {
      uri: mode === "breadcrumbs" ? undefined : "/",
      breadcrumbs: mode === "uri" ? undefined : [],
    }
  }

  /**
   * For a normal page with no parent
   */
  if (!parent) {
    const uri = `/${slug}`
    const breadcrumbs: BreadcrumbItem[] = [
      {
        label: title,
        uri: uri,
        isCurrentPage: true,
      },
    ]

    _visited.delete(currentDocId) // Cleanup
    return {
      uri: mode === "breadcrumbs" ? undefined : uri,
      breadcrumbs: mode === "uri" ? undefined : breadcrumbs,
    }
  }

  /**
   * For a normal page with a parent - SAFE recursive hierarchy traversal
   */
  try {
    const parentDoc = await payload.findByID({
      collection: "pages",
      id: typeof parent === "object" ? parent.id : parent,
      depth: 1,
      overrideAccess: true,
    })

    // Generate parent data recursively with protection
    const parentData = await generatePageIndexData({
      slug: parentDoc.slug,
      data: parentDoc,
      payload,
      mode: "both", // We need both URI and breadcrumbs from parent
      homepageId,
      _visited: new Set(_visited), // Copy to prevent mutation between branches
      _depth: _depth + 1,
    })

    const parentURI = parentData.uri || `/${parentDoc.slug}`
    const currentURI = `${parentURI === "/" ? "" : parentURI}/${slug}`

    // Build breadcrumbs from parent chain
    const parentBreadcrumbs = parentData.breadcrumbs || []

    // Remove isCurrentPage from all parent breadcrumbs
    const cleanParentBreadcrumbs = parentBreadcrumbs.map(crumb => ({
      ...crumb,
      isCurrentPage: false,
    }))

    const currentBreadcrumbs: BreadcrumbItem[] = [
      ...cleanParentBreadcrumbs,
      {
        label: title,
        uri: currentURI,
        isCurrentPage: true,
      },
    ]

    _visited.delete(currentDocId) // Cleanup
    return {
      uri: mode === "breadcrumbs" ? undefined : currentURI,
      breadcrumbs: mode === "uri" ? undefined : currentBreadcrumbs,
    }
  } catch (error) {
    payload.logger.warn({ error }, "Failed to generate hierarchical page data")

    _visited.delete(currentDocId) // Cleanup
    throw error
  }
}

/*************************************************************************/
/*  FALLBACK RESULT CREATOR FOR SAFE HIERARCHY TRAVERSAL
/*************************************************************************/

function createFallbackPageResult(slug: string, title: string): IndexData {
  const fallbackURI = `/${slug}`
  const fallbackBreadcrumbs: BreadcrumbItem[] = [
    {
      label: title,
      uri: fallbackURI,
      isCurrentPage: true,
    },
  ]

  return {
    uri: fallbackURI,
    breadcrumbs: fallbackBreadcrumbs,
  }
}

/*************************************************************************/
/*  COLLECTION ITEM INDEX DATA GENERATION

  - Mirrors the URI generation logic but builds breadcrumb chains
  - Includes archive page in breadcrumb chain when available
  - Falls back to collection name when no archive page is set
/*************************************************************************/

async function generateCollectionIndexData({
  collection,
  slug,
  data,
  originalDoc,
  settings,
  payload,
  mode,
  homepageId,
}: {
  collection: string
  slug: string
  data?: any
  originalDoc?: any
  settings: any
  payload: any
  mode: IndexDataMode
  homepageId?: string | null
}): Promise<IndexData> {
  const archivePageField = `${collection}ArchivePage`
  const title = data?.title || originalDoc?.title || slug

  /**
   * Priority 1: Archive page slug (if collection has designated archive page)
   */
  const archivePageValue = settings[archivePageField]

  if (archivePageValue) {
    try {
      const archivePage = await payload.findByID({
        collection: "pages",
        id: archivePageValue?.id || archivePageValue,
        depth: 1,
        overrideAccess: true,
      })

      if (archivePage) {
        // Derive from current settings/parents: stored URI may await a worker.
        let archivePageURI: string | undefined
        {
          const archiveData = await generatePageIndexData({
            slug: archivePage.slug,
            data: archivePage,
            payload,
            mode: "uri",
            homepageId,
            _visited: new Set<string>(),
            _depth: 0,
          })
          archivePageURI = archiveData.uri
        }

        if (archivePageURI) {
          const currentURI = `${archivePageURI === "/" ? "" : archivePageURI}/${slug}`

          let breadcrumbs: BreadcrumbItem[] = []

          if (mode !== "uri") {
            // Get archive page breadcrumbs with protection
            const archiveData = await generatePageIndexData({
              slug: archivePage.slug,
              data: archivePage,
              payload,
              mode: "breadcrumbs",
              homepageId,
              _visited: new Set<string>(), // Fresh protection for archive page hierarchy
              _depth: 0,
            })

            // Remove isCurrentPage from archive breadcrumbs
            const cleanArchiveBreadcrumbs = (archiveData.breadcrumbs || []).map(
              crumb => ({
                ...crumb,
                isCurrentPage: false,
              })
            )

            breadcrumbs = [
              ...cleanArchiveBreadcrumbs,
              {
                label: title,
                uri: currentURI,
                isCurrentPage: true,
              },
            ]
          }

          return {
            uri: mode === "breadcrumbs" ? undefined : currentURI,
            breadcrumbs: mode === "uri" ? undefined : breadcrumbs,
          }
        }
      }
    } catch (error) {
      payload.logger.warn(
        { error, collection },
        `Failed to fetch archive page for ${collection}`
      )
      throw error
    }
  }

  /**
   * Fallback: Original collection slug
   */
  const fallbackURI = `/${collection}/${slug}`
  const collectionLabel = collection.charAt(0).toUpperCase() + collection.slice(1)

  const fallbackBreadcrumbs: BreadcrumbItem[] = [
    {
      label: collectionLabel,
      uri: `/${collection}`,
      isCurrentPage: false,
    },
    {
      label: title,
      uri: fallbackURI,
      isCurrentPage: true,
    },
  ]

  return {
    uri: mode === "breadcrumbs" ? undefined : fallbackURI,
    breadcrumbs: mode === "uri" ? undefined : fallbackBreadcrumbs,
  }
}

/*************************************************************************/
/*  URI CONFLICT DETECTION
/*************************************************************************/

export interface URIConflictResult {
  collection: string
  slug: string
  id: string
  title?: string
}

async function checkConflict({
  uri,
  collection,
  documentId,
  payload,
  req,
}: {
  uri: string
  collection: string
  documentId?: string
  payload: any
  req?: PayloadRequest
}): Promise<URIConflictResult | null> {
  if (!uri || uri === "") return null

  const indexResult = await checkURIConflict(uri, collection, documentId, req)

  if (!indexResult || !indexResult.hasConflict) {
    return null
  }

  if (indexResult.conflictingCollection) {
    try {
      // Find the document directly instead of using cache
      const conflictIndexEntry = await payload.find({
        collection: "uri-index",
        where: { uri: { equals: uri } },
        limit: 1,
        overrideAccess: true,
      })

      if (conflictIndexEntry.docs[0]) {
        const indexDoc = conflictIndexEntry.docs[0] as any
        const conflictDoc = await payload.findByID({
          collection: indexDoc.sourceCollection,
          id: indexDoc.documentId,
          depth: 0,
          overrideAccess: true,
        })

        if (conflictDoc) {
          return {
            collection: indexResult.conflictingCollection,
            slug: conflictDoc.slug,
            id: conflictDoc.id,
            title: conflictDoc.title,
          }
        }
      }
    } catch (error) {
      payload.logger.error({ error }, "Failed to get conflict document details")
    }
  }

  return null
}

/*************************************************************************/
/*  URI VALIDATION UTILITIES

    - Global URI Rules:
      - Must start with /
      - No double slashes
      - No trailing slash except for root
      - No spaces or special characters (basic validation)

/*************************************************************************/

export function validateURI(uri: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!uri) {
    errors.push("URI cannot be empty - use '/' for homepage")
    return { isValid: false, errors }
  }

  if (!uri.startsWith("/")) {
    errors.push("URI must start with /")
  }

  if (uri.includes("//")) {
    errors.push("URI cannot contain double slashes")
  }

  if (uri.length > 1 && uri.endsWith("/")) {
    errors.push("URI cannot end with /")
  }

  if (
    /[\s\\?#\u0000-\u001f]/u.test(uri) ||
    uri.split("/").some(part => part === "." || part === "..")
  ) {
    errors.push(
      "URI contains whitespace, control characters, a query/fragment, or an unsafe path segment"
    )
  }

  if (isReservedURI(uri)) {
    errors.push(
      `URI cannot start with reserved prefix (${RESERVED_URI_PREFIXES.join(", ")})`
    )
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/*************************************************************************/
/*  ROUTING ENGINE API
/*************************************************************************/

export const routingEngine = {
  /**
   * Generate URI for document (used in Payload hooks)
   */
  generateURI: async ({
    collection, // Collection slug
    slug, // Document slug
    data,
    originalDoc,
    req,
    settings,
  }: {
    collection: string
    slug: string
    data?: any
    originalDoc?: any
    req?: PayloadRequest
    settings?: any
  }): Promise<string> => {
    const payload = req
      ? requestPayload(req)
      : await currentGetPayload({ config: configPromise })

    let routingSettings
    if (settings) {
      routingSettings = settings.routing || {}
    } else {
      const globalSettings = await payload.findGlobal({
        slug: "settings",
        depth: 0,
        overrideAccess: true,
      })
      routingSettings = globalSettings.routing || {}
    }

    const result = await generateDocumentIndexData({
      collection,
      slug,
      data,
      originalDoc,
      settings: routingSettings,
      payload,
      mode: "uri",
    })

    const generatedURI = result.uri!
    const validation = validateURI(generatedURI)
    if (!validation.isValid) throw new Error(validation.errors.join("; "))

    const currentDocId = data?.id || originalDoc?.id
    const conflict = await checkConflict({
      uri: generatedURI,
      collection,
      documentId: currentDocId,
      payload,
      req,
    })

    if (conflict) {
      payload.logger.warn(
        `URI conflict detected: ${generatedURI} conflicts with ${conflict.collection}/${conflict.slug}`
      )
    }

    return generatedURI
  },

  /**
   * Generate breadcrumbs for document
   */
  generateBreadcrumbs: async ({
    collection,
    slug,
    data,
    originalDoc,
    req,
    enforceAccess = false,
  }: {
    collection: string
    slug: string
    data?: any
    originalDoc?: any
    req?: PayloadRequest
    enforceAccess?: boolean
  }): Promise<BreadcrumbItem[]> => {
    if (enforceAccess && !req?.user) return []
    const payload = req
      ? requestPayload(req, enforceAccess)
      : await currentGetPayload({ config: configPromise })

    const settings = await payload.findGlobal({
      slug: "settings",
      depth: 0,
      overrideAccess: true,
    })

    const routingSettings = settings.routing || {}

    const result = await generateDocumentIndexData({
      collection,
      slug,
      data,
      originalDoc,
      settings: routingSettings,
      payload,
      mode: "breadcrumbs",
    })

    return result.breadcrumbs!
  },

  /**
   * Generate both URI and breadcrumbs for document (used in URI Index updates)
   */
  generateURIAndBreadcrumbs: async ({
    collection,
    slug,
    data,
    originalDoc,
    req,
  }: {
    collection: string
    slug: string
    data?: any
    originalDoc?: any
    req?: PayloadRequest
  }): Promise<{ uri: string; breadcrumbs: BreadcrumbItem[] }> => {
    const payload = req
      ? requestPayload(req)
      : await currentGetPayload({ config: configPromise })

    const settings = await payload.findGlobal({
      slug: "settings",
      depth: 0,
      overrideAccess: true,
    })

    const routingSettings = settings.routing || {}

    // Generate URI and breadcrumbs together (efficient single pass)
    const result = await generateDocumentIndexData({
      collection,
      slug,
      data,
      originalDoc,
      settings: routingSettings,
      payload,
      mode: "both",
    })

    const uri = result.uri!
    const validation = validateURI(uri)
    if (!validation.isValid) throw new Error(validation.errors.join("; "))
    const breadcrumbs = result.breadcrumbs!

    const currentDocId = data?.id || originalDoc?.id
    const conflict = await checkConflict({
      uri,
      collection,
      documentId: currentDocId,
      payload,
      req,
    })

    if (conflict) {
      payload.logger.warn(
        `URI conflict detected: ${uri} conflicts with ${conflict.collection}/${conflict.slug}`
      )
    }

    return { uri, breadcrumbs }
  },

  /**
   * Check conflicts (used during generation) - O(1) via URI index
   */
  checkConflicts: async (
    uri: string,
    excludeDocId?: string
  ): Promise<URIConflictResult | null> => {
    const payload = await currentGetPayload({ config: configPromise })

    return await checkConflict({
      uri,
      collection: "",
      documentId: excludeDocId,
      payload,
    })
  },

  /**
   * Validate URI format
   */
  validate: validateURI,

  /**
   * Convert Next.js slug array to URI
   */
  slugToURI: (slugArray: string[]): string => {
    if (!slugArray || slugArray.length === 0) {
      return "/"
    }
    const slugPath = slugArray.join("/")
    return `/${slugPath}`
  },

  /**
   * Convert URI to Next.js slug array
   */
  uriToSlug: (uri: string): string[] => {
    if (!uri || uri === "/" || uri === "") {
      return []
    }
    return uri.split("/").filter(Boolean)
  },

  /**
   * Normalize URI by removing trailing slashes while preserving homepage
   */
  normalizeURI: (uri: string): string => {
    // Homepage should always remain as "/"
    if (uri === "/") return "/"

    // Remove trailing slashes from other paths
    return uri.replace(/\/+$/, "")
  },
  isReservedURI: (uri: string): boolean => {
    return isReservedURI(uri)
  },
}
