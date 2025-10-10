import configPromise from "@payload-config"
import { getPayload } from "payload"
import { getFrontendCollections } from "@/admin/config/frontend"
import { routingEngine, BreadcrumbItem } from "./uri-engine"
import { createAutomaticRedirect } from "@/admin/redirects/auto-redirects"
import { formatIdForText, formatIdForRelationship } from "@/admin/payload/db/id-utils"

/*************************************************************************/
/*

  URI INDEX MANAGER

  Used to manage all operations related to the URI index.
  URI Index stores the URI of FRONTEND-ONLY collection documents in the URI index.

  - updateURI() - Real-time updates from hooks
  - deleteURI() - Cleanup when documents are deleted
  - checkURIConflict() - Check if a URI is already taken, with priority based on frontend collections order for conflict resolution.
  - regenerateURIs() - Populate the URI index with the documents from the frontend collections.


/*************************************************************************/

export interface URIIndexUpdate {
  uri: string
  collection: string
  documentId: string
  status: "published" | "draft"
  previousURI?: string
  templateId?: string
  breadcrumbs?: BreadcrumbItem[]
  data?: any
  originalDoc?: any
}

/*************************************************************************/
/*  UPDATE URI INDEX ENTRY
/*************************************************************************/

export async function updateURI({
  uri,
  collection,
  documentId,
  status,
  previousURI,
  templateId,
  breadcrumbs,
  data,
  originalDoc,
}: URIIndexUpdate): Promise<void> {
  try {
    const payload = await getPayload({ config: configPromise })

    const formattedDocumentId = formatIdForText(documentId)

    const existingEntries = await payload.find({
      collection: "uri-index",
      where: {
        and: [
          { sourceCollection: { equals: collection } },
          { documentId: { equals: formattedDocumentId } },
        ],
      },
      limit: 10,
    })

    /**
     * Auto-detect template ID if not provided
     */
    const resolvedTemplateId =
      templateId || (await getTemplateIdForCollection(collection, payload))

    /**
     * Generate breadcrumbs if not provided
     */
    let resolvedBreadcrumbs = breadcrumbs
    if (!resolvedBreadcrumbs && (data || originalDoc)) {
      try {
        resolvedBreadcrumbs = await routingEngine.generateBreadcrumbs({
          collection,
          slug: data?.slug || originalDoc?.slug,
          data,
          originalDoc,
        })
      } catch (error) {
        payload.logger.warn(
          `Failed to generate breadcrumbs for ${collection}/${documentId}:`,
          error
        )
        resolvedBreadcrumbs = []
      }
    }

    const normalizedPreviousURI =
      previousURI && previousURI !== uri ? previousURI : undefined

    const slugChanged = Boolean(normalizedPreviousURI)

    let redirectSource = normalizedPreviousURI

    const publishedEntry = existingEntries.docs.find((doc: any) => doc.status === "published")
    const draftEntry = existingEntries.docs.find((doc: any) => doc.status === "draft")

    const targetEntry = publishedEntry || draftEntry
    const indexStatus = publishedEntry ? "published" : status

    const indexData = {
      uri,
      sourceCollection: collection,
      documentId: formattedDocumentId,
      document: {
        relationTo: collection as any,
        value: formatIdForRelationship(documentId),
      },
      status: indexStatus,
      templateId: resolvedTemplateId,
      breadcrumbs: resolvedBreadcrumbs || [],
      previousURIs:
        normalizedPreviousURI && targetEntry?.previousURIs
          ? [{ uri: normalizedPreviousURI }, ...targetEntry.previousURIs]
              .filter((prev, index, self) =>
                prev?.uri && self.findIndex(existing => existing?.uri === prev.uri) === index
              )
              .slice(0, 10)
          : normalizedPreviousURI
          ? [{ uri: normalizedPreviousURI }]
          : targetEntry?.previousURIs,
    }

    if (targetEntry) {
      await payload.update({
        collection: "uri-index",
        id: targetEntry.id,
        data: indexData as any,
      })
    } else {
      await payload.create({
        collection: "uri-index",
        data: indexData as any,
      })
    }

    if (status === "published" && draftEntry?.id && draftEntry.id !== targetEntry?.id) {
      try {
        await payload.delete({ collection: "uri-index", id: draftEntry.id })
      } catch (error) {
        payload.logger.warn(
          `Failed to clean up draft URI index entry for ${collection}/${documentId}:`,
          error
        )
      }
    }

    if (status === "published" && slugChanged) {
      const redirectBaseline = publishedEntry || targetEntry

      if (!redirectSource && redirectBaseline) {
        const historicalURI = redirectBaseline.previousURIs?.find(
          (prev: any) => prev?.uri && prev.uri !== uri
        )?.uri

        if (historicalURI) {
          redirectSource = historicalURI
        }
      }

      if (
        !redirectSource &&
        redirectBaseline &&
        redirectBaseline.uri &&
        redirectBaseline.uri !== uri
      ) {
        redirectSource = redirectBaseline.uri
      }

      if (redirectSource && redirectSource !== uri) {
        const redirectResult = await createAutomaticRedirect(redirectSource, uri)
        if (redirectResult.success) {
          payload.logger.info(`✅ Automatic redirect created: ${redirectSource} → ${uri}`)
        } else {
          payload.logger.warn(`⚠️ Automatic redirect skipped: ${redirectResult.message}`)
        }
      }
    }
  } catch (error) {
    const payload = await getPayload({ config: configPromise })
    payload.logger.error("Failed to update URI index:", error)
  }
}

/*************************************************************************/
/*  DELETE FROM URI INDEX
/*************************************************************************/

export async function deleteURI(collection: string, documentId: string): Promise<void> {
  try {
    const payload = await getPayload({ config: configPromise })

    const formattedDocumentId = formatIdForText(documentId)

    const existingEntries = await payload.find({
      collection: "uri-index",
      where: {
        and: [
          { sourceCollection: { equals: collection } },
          { documentId: { equals: formattedDocumentId } },
        ],
      },
      limit: 10,
    })

    if (existingEntries.docs.length > 0) {
      await Promise.all(
        existingEntries.docs.map((entry: any) =>
          payload.delete({
            collection: "uri-index",
            id: entry.id,
          })
        )
      )
    }
  } catch (error) {
    const payload = await getPayload({ config: configPromise })
    payload.logger.error("Failed to delete from URI index:", error)
  }
}

/*************************************************************************/
/*  URI CONFLICT DETECTION WITH INDEX

    Check if a URI is already taken, with priority based on frontend
    collections order for conflict resolution.
/*************************************************************************/

export async function checkURIConflict(
  uri: string,
  excludeCollection?: string,
  excludeDocumentId?: string
): Promise<{ hasConflict: boolean; conflictingCollection?: string } | null> {
  try {
    const payload = await getPayload({ config: configPromise })
    const normalizedURI = routingEngine.normalizeURI(uri)
    const normalizedExcludeId =
      typeof excludeDocumentId !== "undefined"
        ? formatIdForText(excludeDocumentId)
        : undefined

    const conflicts = await payload.find({
      collection: "uri-index",
      where: {
        uri: { equals: normalizedURI },
      },
      limit: 10,
    })

    const actualConflicts = conflicts.docs.filter((doc: any) => {
      if (excludeCollection && excludeDocumentId) {
        return !(
          doc.sourceCollection === excludeCollection &&
          doc.documentId === normalizedExcludeId
        )
      }
      return true
    })

    if (actualConflicts.length === 0) {
      return { hasConflict: false }
    }

    const frontendCollections = getFrontendCollections()

    const collectionPriorities = frontendCollections.reduce(
      (acc, collection, index) => {
        acc[collection.slug] = index
        return acc
      },
      {} as Record<string, number>
    )

    const highestPriorityConflict = actualConflicts.reduce((highest, current) => {
      const currentPriority = collectionPriorities[current.sourceCollection] ?? 999
      const highestPriority = collectionPriorities[highest.sourceCollection] ?? 999
      return currentPriority < highestPriority ? current : highest
    })

    return {
      hasConflict: true,
      conflictingCollection: highestPriorityConflict.sourceCollection,
    }
  } catch (error) {
    const payload = await getPayload({ config: configPromise })
    payload.logger.error("Failed to check URI conflict:", error)
    return null
  }
}

/*************************************************************************/
/*  TEMPLATE ID DETECTION FOR COLLECTIONS
/*************************************************************************/

export async function getTemplateIdForCollection(
  collection: string,
  payload?: any
): Promise<string | null> {
  try {
    // Use payload parameter if provided, otherwise get fresh instance
    const payloadInstance = payload || (await getPayload({ config: configPromise }))

    const settings = await payloadInstance.findGlobal({
      slug: "settings",
      depth: 0,
      overrideAccess: true,
    })

    const routing = settings?.routing

    if (!routing) return null

    /**
     * Determine template field name based on collection
     */
    const templateField =
      collection === "pages" ? "pagesDefaultTemplate" : `${collection}SingleTemplate`

    const templateValue = routing[templateField]

    // Handle relationship object or direct ID
    if (templateValue) {
      return typeof templateValue === "object" ? templateValue.id : templateValue
    }

    return null
  } catch (error) {
    console.warn(`Failed to get template ID for collection ${collection}:`, error)
    return null
  }
}

/*************************************************************************/
/*  REGENERATE URIs

    Regenerate all URIs for all frontend collections.
    This is used to ensure that all URIs are up to date and consistent.
    It is also used to reset the URI index.

/*************************************************************************/

export interface PopulationStats {
  totalFound: number
  populated: number
  skipped: number
  errors: number
  collections: Record<string, { found: number; populated: number; errors: number }>
}

export async function regenerateURIs(context?: any): Promise<PopulationStats> {
  const stats: PopulationStats = {
    totalFound: 0,
    populated: 0,
    skipped: 0,
    errors: 0,
    collections: {},
  }

  const frontendCollections = getFrontendCollections()

  try {
    const payload = await getPayload({ config: configPromise })

    const collectionResults = await Promise.allSettled(
      frontendCollections.map(collection =>
        processCollectionBatch(collection, payload, context)
      )
    )

    collectionResults.forEach((result, index) => {
      const collection = frontendCollections[index]

      if (result.status === "fulfilled") {
        const collectionStats = result.value
        stats.collections[collection.slug] = collectionStats
        stats.totalFound += collectionStats.found
        stats.populated += collectionStats.populated
        stats.errors += collectionStats.errors
      } else {
        payload.logger.error(
          `Failed to process collection ${collection.slug}:`,
          result.reason
        )
        stats.collections[collection.slug] = { found: 0, populated: 0, errors: 1 }
        stats.errors++
      }
    })

    payload.logger.info(
      `URI regeneration complete: ${stats.populated}/${stats.totalFound} documents processed, ${stats.errors} errors`
    )
    return stats
  } catch (error) {
    const payload = await getPayload({ config: configPromise })
    payload.logger.error("URI regeneration failed with critical error:", error)
    throw error
  }
}

/*************************************************************************/
/*  BATCH PROCESSING HELPERS
/*************************************************************************/

async function processCollectionBatch(
  collection: any,
  payload: any,
  context?: any
): Promise<{ found: number; populated: number; errors: number }> {
  const collectionStats = { found: 0, populated: 0, errors: 0 }
  const BATCH_SIZE = 50 // Process in smaller chunks for memory efficiency

  try {
    payload.logger.info(`Processing collection: ${collection.slug}`)

    /**
     * Check if collection has status field and get template ID
     */

    const [hasStatusField, templateId] = await Promise.all([
      checkForStatusField(collection.slug, payload, context),
      getTemplateIdForCollection(collection.slug),
    ])

    /**
     * Fetch all documents for this collection
     */
    const documents = await payload.find({
      collection: collection.slug as any,
      where: {
        and: [{ slug: { exists: true } }, { slug: { not_equals: "" } }],
      },
      limit: 2000,
      depth: 1,
      context,
    })

    collectionStats.found = documents.docs.length

    if (documents.docs.length === 0) {
      return collectionStats
    }

    // Process documents in batches
    for (let i = 0; i < documents.docs.length; i += BATCH_SIZE) {
      const batch = documents.docs.slice(i, i + BATCH_SIZE)

      const batchResults = await Promise.allSettled(
        batch.map(
          (doc: { id: string; slug: string; _status?: string; [key: string]: any }) =>
            processDocumentOptimized(
              doc,
              collection.slug,
              hasStatusField,
              templateId,
              payload,
              context
            )
        )
      )

      batchResults.forEach((result, batchIndex) => {
        if (result.status === "fulfilled") {
          collectionStats.populated++
        } else {
          const doc = batch[batchIndex]
          console.error(
            `  ❌ Failed to process ${collection.slug}/${doc.slug}:`,
            result.reason
          )
          collectionStats.errors++
        }
      })
    }

    return collectionStats
  } catch (error) {
    console.error(`❌ Failed to process collection ${collection.slug}:`, error)
    throw error
  }
}

async function processDocumentOptimized(
  doc: { id: string; slug: string; _status?: string; [key: string]: any },
  collectionSlug: string,
  hasStatusField: boolean,
  templateId: string | null,
  payload: any,
  context?: any
): Promise<void> {
  /**
   * Generate URI and breadcrumbs in a single pass (optimized)
   */
  const result = await routingEngine.generateURIAndBreadcrumbs({
    collection: collectionSlug,
    slug: doc.slug,
    data: doc,
  })

  /**
   * Validate URI
   */
  if (!result.uri || result.uri.trim() === "") {
    throw new Error(`Empty URI generated for ${collectionSlug}/${doc.slug}`)
  }

  /**
   * Batch database operations
   */
  const operations = [
    /**
     * Update document with new URI
     */
    payload.update({
      collection: collectionSlug as any,
      id: doc.id,
      data: { uri: result.uri },
      draft: hasStatusField ? doc._status === "draft" : false,
      context,
    }),

    /**
     * Upsert URI index entry (more efficient than find + update/create)
     */
    upsertURIIndexEntry({
      uri: result.uri,
      sourceCollection: collectionSlug,
      documentId: doc.id,
      status: hasStatusField ? doc._status || "published" : "published",
      templateId,
      breadcrumbs: result.breadcrumbs,
      payload,
      context,
    }),
  ]

  /**
   * Execute operations in parallel
   */
  await Promise.all(operations)
}

async function upsertURIIndexEntry({
  uri,
  sourceCollection,
  documentId,
  status,
  templateId,
  breadcrumbs,
  payload,
  context,
}: {
  uri: string
  sourceCollection: string
  documentId: string
  status: string
  templateId: string | null
  breadcrumbs: BreadcrumbItem[]
  payload: any
  context?: any
}): Promise<void> {
  // Use simple ID formatting utilities

  // Try to find existing entry
  const formattedDocumentId = formatIdForText(documentId)

  const existingEntries = await payload.find({
    collection: "uri-index",
    where: {
      and: [
        { sourceCollection: { equals: sourceCollection } },
        { documentId: { equals: formattedDocumentId } },
      ],
    },
    limit: 10,
    context,
  })

  const targetEntry = existingEntries.docs.find((entry: any) => entry.status === status)

  const indexData = {
    uri,
    sourceCollection,
    documentId: formattedDocumentId,
    document: {
      relationTo: sourceCollection as any,
      value: formatIdForRelationship(documentId),
    },
    status,
    templateId,
    breadcrumbs,
    previousURIs: targetEntry?.previousURIs,
  }

  if (targetEntry) {
    await payload.update({
      collection: "uri-index",
      id: targetEntry.id,
      data: indexData,
      context,
    })
  } else {
    await payload.create({
      collection: "uri-index",
      data: indexData,
      context,
    })
  }
}

/*************************************************************************/
/*  CHECK FOR STATUS FIELD
/*************************************************************************/

async function checkForStatusField(
  collectionSlug: string,
  payload: any,
  context?: any
): Promise<boolean> {
  try {
    await payload.find({
      collection: collectionSlug as any,
      where: { _status: { exists: true } },
      limit: 1,
      context,
    })
    return true
  } catch (error) {
    return false
  }
}
