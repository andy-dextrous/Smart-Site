import { getDependentUpdatesImpactSize } from "@/lib/routing/dependency-detection"
import {
  processArchivePageUpdate,
  processPageHierarchyUpdate,
  processHomepageChange,
  processSettingsChange,
  processTemplateChange,
  processTemplateContentChange,
  type DependentUpdatesResult,
} from "./update-functions"
import { updateURI } from "@/lib/routing/index-manager"
import { routingEngine } from "@/lib/routing/uri-engine"
import { detectChanges } from "@/lib/cache/change-detection"

/*************************************************************************/
/*  DEPENDENT UPDATES JOB TYPES
/*************************************************************************/

export interface DependentUpdatesJobInput {
  operations: Array<{
    operation:
      | "archive-page-update"
      | "page-hierarchy-update"
      | "homepage-change"
      | "settings-change"
      | "template-change"
      | "template-content-change"
    entityId: string
    additionalData?: {
      oldSlug?: string
      newSlug?: string
      oldParent?: string
      newParent?: string
      affectedCollections?: string[]
      oldHomepage?: string
      templateId?: string
      templateName?: string
      templateChanges?: Array<{
        collection: string
        oldTemplate?: string
        newTemplate?: string
      }>
      freshSettings?: any
    }
  }>
  requestId: string
  batchedAt: string
}

export interface DependentUpdatesJobOutput {
  success: boolean
  totalOperations: number
  documentsUpdated: number
  redirectsCreated: number
  cacheEntriesCleared: number
  errors: string[]
  processedAt: string
  requestId: string
  impactSize: number
  operationsProcessed: string[]
}

/*************************************************************************/
/*  DOCUMENT UPDATE TRACKING
/*************************************************************************/

interface DocumentUpdateInfo {
  collection: string
  documentId: string
  oldURI: string
  newURI: string
  status: "published" | "draft"
  templateId?: string
  operation: string
  doc: any
}

/*************************************************************************/
/*  MAIN DEPENDENT UPDATES HANDLER (BATCH ORCHESTRATION LAYER)

    Background job orchestrator for complex URI dependency updates. Handles batched
    dependent update operations that maintain URI consistency across the entire site when
    foundational changes occur:

    - Archive Page Updates: When archive page slugs change (e.g., /blog → /articles),
      updates all dependent collection items and creates redirects
    - Page Hierarchy Updates: When parent pages change, updates all descendant page URIs
      and maintains proper redirect chains
    - Homepage Changes: When homepage designation changes in settings, handles both
      old homepage (/ → /home) and new homepage (/welcome → /) transitions
    - Settings Changes: When global archive page assignments change, regenerates URIs
      for all affected collection items

    Now processes multiple operations in a single batch to prevent race conditions
    and database conflicts. Each document is updated exactly once with its final URI
    regardless of how many operations would affect it.

/*************************************************************************/

export async function uriDependentUpdatesHandler({
  input,
  req,
}: {
  input: DependentUpdatesJobInput
  req: any
}): Promise<{ output: DependentUpdatesJobOutput }> {
  const { payload } = req
  const logger = payload.logger
  const { operations, requestId, batchedAt } = input

  logger.info(
    `Starting batched dependent updates job: ${operations.length} operations, request ID: ${requestId}`
  )

  const result: DependentUpdatesJobOutput = {
    success: false,
    totalOperations: operations.length,
    documentsUpdated: 0,
    redirectsCreated: 0,
    cacheEntriesCleared: 0,
    errors: [],
    processedAt: new Date().toISOString(),
    requestId,
    impactSize: 0,
    operationsProcessed: [],
  }

  try {
    // Calculate total impact size across all operations
    const impactPromises = operations.map(op =>
      getDependentUpdatesImpactSize(op.operation, op.entityId)
    )
    const impactSizes = await Promise.all(impactPromises)
    result.impactSize = impactSizes.reduce((total, size) => total + size, 0)

    // Collect all document updates across all operations
    const documentUpdates = new Map<string, DocumentUpdateInfo>()
    const allBatchUpdates = []

    // Process each operation and collect document updates
    for (const operation of operations) {
      try {
        logger.info(
          `Processing operation: ${operation.operation} for entity ${operation.entityId}`
        )

        const operationResult = await getDocumentUpdatesForOperation(operation, payload)

        // Collect unique document updates
        for (const update of operationResult.documentUpdates) {
          const key = `${update.collection}:${update.documentId}`

          if (!documentUpdates.has(key)) {
            documentUpdates.set(key, update)
          } else {
            // Document already scheduled for update - merge updates intelligently
            const existingUpdate = documentUpdates.get(key)!

            // Merge the updates, prioritizing template information from template-change operations
            const mergedUpdate = {
              ...existingUpdate,
              // Use the latest URI (they should be the same anyway)
              newURI: update.newURI,
              // Prioritize template ID from template-change operations
              templateId: update.templateId || existingUpdate.templateId,
              // Keep track of all operations that affected this document
              operation:
                existingUpdate.operation === update.operation
                  ? update.operation
                  : `${existingUpdate.operation}+${update.operation}`,
            }

            documentUpdates.set(key, mergedUpdate)
            logger.debug(
              `Document ${key} updated by multiple operations, merged template info`
            )
          }
        }

        // Collect batch updates for cache invalidation
        allBatchUpdates.push(...operationResult.batchUpdates)
        result.operationsProcessed.push(`${operation.operation}:${operation.entityId}`)
      } catch (error) {
        logger.error(`Failed to process operation ${operation.operation}:`, error)
        result.errors.push(
          `${operation.operation}: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    }

    // Execute all unique document updates
    logger.info(`Executing ${documentUpdates.size} unique document updates`)

    for (const update of documentUpdates.values()) {
      try {
        await executeDocumentUpdate(update, payload)
        result.documentsUpdated++
      } catch (error) {
        logger.error(
          `Failed to update document ${update.collection}:${update.documentId}:`,
          error
        )
        result.errors.push(
          `Document update failed: ${update.collection}:${update.documentId} - ${error instanceof Error ? error.message : String(error)}`
        )
      }
    }

    // Batch process cache invalidation for all updates
    if (allBatchUpdates.length > 0) {
      try {
        const operations = allBatchUpdates.map(update => ({
          collection: update.collection,
          doc: update.doc,
          previousDoc: { ...update.doc, uri: update.changes.oldUri },
          action: "update" as const,
        }))

        const { batchRevalidate } = await import("@/lib/cache")
        const invalidationResults = await batchRevalidate({ operations })
        result.cacheEntriesCleared = invalidationResults.operations.reduce(
          (total: number, res: any) => total + (res.tagsInvalidated?.length || 0),
          0
        )
      } catch (error) {
        logger.error("Failed to process batch cache invalidation:", error)
        result.errors.push(
          `Cache invalidation failed: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    }

    result.success = result.errors.length === 0

    logger.info(
      `Completed batched dependent updates: ${result.documentsUpdated} documents updated, ${result.cacheEntriesCleared} cache entries cleared, ${result.errors.length} errors`
    )
  } catch (error) {
    logger.error(`Batched dependent updates job failed:`, error)
    result.errors.push(error instanceof Error ? error.message : String(error))
  }

  return { output: result }
}

/*************************************************************************/
/*  OPERATION PROCESSING HELPERS
/*************************************************************************/

async function getDocumentUpdatesForOperation(
  operation: any,
  payload: any
): Promise<{
  documentUpdates: DocumentUpdateInfo[]
  batchUpdates: any[]
}> {
  const documentUpdates: DocumentUpdateInfo[] = []
  const batchUpdates: any[] = []

  // Import the helper functions for getting documents
  const {
    getArchiveChildCollections,
    getCollectionItemsForArchive,
    findDescendantPages,
  } = await import("@/lib/routing/dependency-detection")

  switch (operation.operation) {
    case "archive-page-update": {
      const dependencies = await getArchiveChildCollections(operation.entityId, payload)

      for (const dependency of dependencies) {
        const items = await getCollectionItemsForArchive(dependency.collection)

        for (const item of items) {
          const oldURI = item.uri
          const newURI = await routingEngine.generateURI({
            collection: dependency.collection,
            slug: item.slug,
            data: item,
          })

          if (oldURI !== newURI) {
            documentUpdates.push({
              collection: dependency.collection,
              documentId: item.id,
              oldURI,
              newURI,
              status: item._status || "published",
              operation: operation.operation,
              doc: item,
            })

            const changes = detectChanges(
              { ...item, uri: newURI },
              { ...item, uri: oldURI }
            )

            batchUpdates.push({
              collection: dependency.collection,
              doc: { ...item, uri: newURI },
              changes,
            })
          }
        }
      }
      break
    }

    case "page-hierarchy-update": {
      const descendants = await findDescendantPages(operation.entityId)

      for (const descendant of descendants) {
        const oldURI = descendant.uri
        const newURI = await routingEngine.generateURI({
          collection: "pages",
          slug: descendant.slug,
          data: descendant,
        })

        if (oldURI !== newURI) {
          documentUpdates.push({
            collection: "pages",
            documentId: descendant.id,
            oldURI,
            newURI,
            status: descendant._status || "published",
            operation: operation.operation,
            doc: descendant,
          })

          const changes = detectChanges(
            { ...descendant, uri: newURI },
            { ...descendant, uri: oldURI }
          )

          batchUpdates.push({
            collection: "pages",
            doc: { ...descendant, uri: newURI },
            changes,
          })
        }
      }
      break
    }

    case "homepage-change": {
      // Get the old and new homepage documents
      const oldHomepageId = operation.additionalData?.oldHomepage
      const newHomepageId = operation.entityId

      // Handle old homepage transition (/ → /slug)
      if (oldHomepageId) {
        try {
          const oldHomepage = await payload.findByID({
            collection: "pages",
            id: oldHomepageId,
            depth: 1,
            overrideAccess: true,
          })

          if (oldHomepage) {
            const oldURI = "/"
            const newURI = `/${oldHomepage.slug}`

            documentUpdates.push({
              collection: "pages",
              documentId: oldHomepage.id,
              oldURI,
              newURI,
              status: oldHomepage._status || "published",
              operation: operation.operation,
              doc: oldHomepage,
            })

            const changes = detectChanges(
              { ...oldHomepage, uri: newURI },
              { ...oldHomepage, uri: oldURI }
            )

            batchUpdates.push({
              collection: "pages",
              doc: { ...oldHomepage, uri: newURI },
              changes,
            })
          }
        } catch (error) {
          // Old homepage not found, continue
        }
      }

      // Handle new homepage transition (/slug → /)
      if (newHomepageId) {
        try {
          const newHomepage = await payload.findByID({
            collection: "pages",
            id: newHomepageId,
            depth: 1,
            overrideAccess: true,
          })

          if (newHomepage) {
            const oldURI = `/${newHomepage.slug}`
            const newURI = "/"

            documentUpdates.push({
              collection: "pages",
              documentId: newHomepage.id,
              oldURI,
              newURI,
              status: newHomepage._status || "published",
              operation: operation.operation,
              doc: newHomepage,
            })

            const changes = detectChanges(
              { ...newHomepage, uri: newURI },
              { ...newHomepage, uri: oldURI }
            )

            batchUpdates.push({
              collection: "pages",
              doc: { ...newHomepage, uri: newURI },
              changes,
            })
          }
        } catch (error) {
          // New homepage not found
        }
      }
      break
    }

    case "settings-change": {
      if (operation.additionalData?.affectedCollections) {
        for (const collectionSlug of operation.additionalData.affectedCollections) {
          const items = await getCollectionItemsForArchive(collectionSlug)

          for (const item of items) {
            const oldURI = item.uri
            const newURI = await routingEngine.generateURI({
              collection: collectionSlug,
              slug: item.slug,
              data: item,
              settings: operation.additionalData.freshSettings,
            })

            if (oldURI !== newURI) {
              documentUpdates.push({
                collection: collectionSlug,
                documentId: item.id,
                oldURI,
                newURI,
                status: item._status || "published",
                operation: operation.operation,
                doc: item,
              })

              const changes = detectChanges(
                { ...item, uri: newURI },
                { ...item, uri: oldURI }
              )

              batchUpdates.push({
                collection: collectionSlug,
                doc: { ...item, uri: newURI },
                changes,
              })
            }
          }
        }
      }
      break
    }

    case "template-change": {
      if (operation.additionalData?.templateChanges) {
        for (const templateChange of operation.additionalData.templateChanges) {
          const items = await getCollectionItemsForArchive(templateChange.collection)

          for (const item of items) {
            const oldURI = item.uri || ""

            const newURI = await routingEngine.generateURI({
              collection: templateChange.collection,
              slug: item.slug,
              data: item,
              settings: operation.additionalData.freshSettings, // Pass fresh settings with new template
            })

            // Always include template changes even if URI doesn't change
            documentUpdates.push({
              collection: templateChange.collection,
              documentId: item.id,
              oldURI,
              newURI: newURI || oldURI,
              status: item._status === "published" ? "published" : "draft",
              templateId: templateChange.newTemplate,
              operation: operation.operation,
              doc: item,
            })

            const changes = detectChanges(
              { ...item, uri: newURI || oldURI },
              { ...item, uri: oldURI }
            )

            batchUpdates.push({
              collection: templateChange.collection,
              doc: { ...item, uri: newURI || oldURI },
              changes,
            })
          }
        }
      }
      break
    }

    case "template-content-change": {
      // Template content changes don't require URI updates, just cache invalidation
      // This is handled by the template revalidation in the hook
      break
    }

    default:
      throw new Error(`Unknown operation: ${operation.operation}`)
  }

  return { documentUpdates, batchUpdates }
}

async function executeDocumentUpdate(
  update: DocumentUpdateInfo,
  payload: any
): Promise<void> {
  // Update URI in index
  await updateURI({
    uri: update.newURI,
    collection: update.collection,
    documentId: update.documentId,
    status: update.status,
    previousURI: update.oldURI !== update.newURI ? update.oldURI : undefined,
    templateId: update.templateId,
  })

  // Update the actual document with new URI
  await payload.update({
    collection: update.collection as any,
    id: update.documentId,
    data: {
      uri: update.newURI,
    },
    overrideAccess: true,
    context: {
      preventHooks: true, // Prevent triggering URI generation hooks again
    },
  })

  payload.logger.info(
    `📍 ${update.operation} → URI updated: ${update.collection}/${update.doc.slug} (${update.oldURI} → ${update.newURI})`
  )
}
