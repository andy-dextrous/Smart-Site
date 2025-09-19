import {
  getArchiveChildCollections,
  getCollectionItemsForArchive,
  findDescendantPages,
} from "@/admin/routing/dependency-detection"
import { updateURI } from "@/admin/routing/index-manager"
import { routingEngine } from "@/admin/routing/uri-engine"
import { batchRevalidate } from "@/admin/cache"
import { detectChanges } from "@/admin/cache/change-detection"
import configPromise from "@payload-config"
import { getPayload } from "payload"

/*************************************************************************/
/*  DEPENDENT UPDATES OPERATION TYPES
/*************************************************************************/

export interface DependentUpdatesResult {
  success: boolean
  documentsUpdated: number
  redirectsCreated: number
  cacheEntriesCleared: number
  errors: string[]
  operation: string
}

export interface DependentUpdatesAdditionalData {
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

/*************************************************************************/
/*  ARCHIVE PAGE UPDATE PROCESSING
/*************************************************************************/

export async function processArchivePageUpdate(
  pageId: string
): Promise<DependentUpdatesResult> {
  const result: DependentUpdatesResult = {
    success: false,
    documentsUpdated: 0,
    redirectsCreated: 0,
    cacheEntriesCleared: 0,
    errors: [],
    operation: "archive-page-update",
  }

  try {
    const payload = await getPayload({ config: configPromise })
    const dependencies = await getArchiveChildCollections(pageId, payload)

    if (dependencies.length === 0) {
      result.success = true
      return result
    }

    const updatedArchivePage = await payload.findByID({
      collection: "pages",
      id: pageId,
      depth: 1,
      overrideAccess: true,
    })
    if (!updatedArchivePage) {
      throw new Error(`Could not find updated page ${pageId}`)
    }

    const batchUpdates = []

    /**
     * Process each collection that uses this archive page
     */
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
          const itemStatus = item._status === "draft" ? "draft" : "published"

          await updateURI({
            uri: newURI,
            collection: dependency.collection,
            documentId: item.id,
            status: itemStatus,
            previousURI: oldURI,
          })

          // Update the actual document with new URI
          await payload.update({
            collection: dependency.collection as any,
            id: item.id,
            data: {
              uri: newURI,
            },
            overrideAccess: true,
            context: {
              preventHooks: true, // Prevent triggering URI generation hooks again
            },
          })

          payload.logger.info(
            `📍 Archive change → URI updated: ${dependency.collection}/${item.slug} (${oldURI} → ${newURI})`
          )

          const changes = detectChanges(
            { ...item, uri: newURI },
            { ...item, uri: oldURI }
          )

          batchUpdates.push({
            collection: dependency.collection,
            doc: { ...item, uri: newURI },
            changes,
          })

          result.documentsUpdated++
        }
      }
    }

    /**
     * Batch process cache invalidation
     */
    if (batchUpdates.length > 0) {
      const operations = batchUpdates.map(update => ({
        collection: update.collection,
        doc: update.doc,
        previousDoc: { ...update.doc, uri: update.changes.oldUri },
        action: "update" as const,
      }))

      const invalidationResults = await batchRevalidate({ operations })
      result.cacheEntriesCleared = invalidationResults.operations.reduce(
        (total: number, res: any) => total + (res.tagsInvalidated?.length || 0),
        0
      )
    }

    result.success = true
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error))
  }

  return result
}

/*************************************************************************/
/*  PAGE HIERARCHY UPDATE PROCESSING
/*************************************************************************/

export async function processPageHierarchyUpdate(
  pageId: string
): Promise<DependentUpdatesResult> {
  const result: DependentUpdatesResult = {
    success: false,
    documentsUpdated: 0,
    redirectsCreated: 0,
    cacheEntriesCleared: 0,
    errors: [],
    operation: "page-hierarchy-update",
  }

  try {
    const payload = await getPayload({ config: configPromise })

    // Find all descendant pages
    const descendants = await findDescendantPages(pageId)

    if (descendants.length === 0) {
      result.success = true
      return result
    }

    const batchUpdates = []

    // Process each descendant page
    for (const descendant of descendants) {
      const oldURI = descendant.uri
      const newURI = await routingEngine.generateURI({
        collection: "pages",
        slug: descendant.slug,
        data: descendant,
      })

      if (oldURI !== newURI) {
        // Update URI in index
        await updateURI({
          uri: newURI,
          collection: "pages",
          documentId: descendant.id,
          status: descendant._status || "published",
          previousURI: oldURI,
        })

        // Update the actual document with new URI
        await payload.update({
          collection: "pages",
          id: descendant.id,
          data: {
            uri: newURI,
          },
          overrideAccess: true,
          context: {
            preventHooks: true, // Prevent triggering URI generation hooks again
          },
        })

        // Track for batch cache invalidation
        const changes = detectChanges(
          { ...descendant, uri: newURI },
          { ...descendant, uri: oldURI }
        )

        batchUpdates.push({
          collection: "pages",
          doc: { ...descendant, uri: newURI },
          changes,
        })

        result.documentsUpdated++
      }
    }

    // Batch process cache invalidation
    if (batchUpdates.length > 0) {
      // Convert to batchRevalidate format
      const operations = batchUpdates.map(update => ({
        collection: update.collection,
        doc: update.doc,
        previousDoc: { ...update.doc, uri: update.changes.oldUri },
        action: "update" as const,
      }))

      const invalidationResults = await batchRevalidate({ operations })
      result.cacheEntriesCleared = invalidationResults.operations.reduce(
        (total: number, res: any) => total + (res.tagsInvalidated?.length || 0),
        0
      )
    }

    result.success = true
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error))
  }

  return result
}

/*************************************************************************/
/*  HOMEPAGE CHANGE PROCESSING
/*************************************************************************/

export async function processHomepageChange(
  newHomepageId: string,
  additionalData?: DependentUpdatesAdditionalData
): Promise<DependentUpdatesResult> {
  const result: DependentUpdatesResult = {
    success: false,
    documentsUpdated: 0,
    redirectsCreated: 0,
    cacheEntriesCleared: 0,
    errors: [],
    operation: "homepage-change",
  }

  try {
    const payload = await getPayload({ config: configPromise })
    const batchUpdates = []

    // Handle old homepage (if exists)
    if (additionalData?.oldHomepage) {
      const oldHomepage = await payload.findByID({
        collection: "pages",
        id: additionalData.oldHomepage,
        depth: 1,
        overrideAccess: true,
      })
      if (oldHomepage) {
        const oldURI = "/"
        const generatedURI = await routingEngine.generateURI({
          collection: "pages",
          slug: oldHomepage.slug || "home",
          data: oldHomepage,
        })
        const newURI = generatedURI ?? `/${oldHomepage.slug || "page"}`

        await updateURI({
          uri: newURI || `/${oldHomepage.slug || "page"}`,
          collection: "pages",
          documentId: oldHomepage.id,
          status: oldHomepage._status || "published",
          previousURI: oldURI,
        })

        const changes = detectChanges(
          { ...oldHomepage, uri: newURI || `/${oldHomepage.slug || "page"}` },
          { ...oldHomepage, uri: oldURI }
        )

        batchUpdates.push({
          collection: "pages",
          doc: { ...oldHomepage, uri: newURI || `/${oldHomepage.slug || "page"}` },
          changes,
        })

        result.documentsUpdated++
      }
    }

    // Handle new homepage
    const newHomepage = await payload.findByID({
      collection: "pages",
      id: newHomepageId,
      depth: 1,
      overrideAccess: true,
    })
    if (newHomepage) {
      const oldURI = newHomepage.uri || ""
      const newURI = "/"

      // Update new homepage URI (from "/page-slug" to "/")
      await updateURI({
        uri: newURI,
        collection: "pages",
        documentId: newHomepage.id,
        status: newHomepage._status || "published",
        previousURI: oldURI || undefined,
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

      result.documentsUpdated++
    }

    // Batch process cache invalidation
    if (batchUpdates.length > 0) {
      // Convert to batchRevalidate format
      const operations = batchUpdates.map(update => ({
        collection: update.collection,
        doc: update.doc,
        previousDoc: { ...update.doc, uri: update.changes.oldUri },
        action: "update" as const,
      }))

      const invalidationResults = await batchRevalidate({ operations })
      result.cacheEntriesCleared = invalidationResults.operations.reduce(
        (total: number, res: any) => total + (res.tagsInvalidated?.length || 0),
        0
      )
    }

    result.success = true
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error))
  }

  return result
}

/*************************************************************************/
/*  SETTINGS CHANGE PROCESSING
/*************************************************************************/

export async function processSettingsChange(
  settingsId: string,
  additionalData?: DependentUpdatesAdditionalData
): Promise<DependentUpdatesResult> {
  const payload = await getPayload({ config: configPromise })

  const result: DependentUpdatesResult = {
    success: false,
    documentsUpdated: 0,
    redirectsCreated: 0,
    cacheEntriesCleared: 0,
    errors: [],
    operation: "settings-change",
  }

  try {
    // Check what settings we're getting
    const freshSettings = await payload.findGlobal({
      slug: "settings",
      depth: 0,
      overrideAccess: true,
    })

    if (!additionalData?.affectedCollections) {
      result.success = true
      return result
    }

    const batchUpdates = []

    // Process each affected collection
    for (const collectionSlug of additionalData.affectedCollections) {
      const items = await getCollectionItemsForArchive(collectionSlug)

      for (const item of items) {
        const oldURI = item.uri

        const newURI = await routingEngine.generateURI({
          collection: collectionSlug,
          slug: item.slug,
          data: item,
          settings: additionalData.freshSettings,
        })

        if (oldURI !== newURI) {
          const itemStatus = item._status === "draft" ? "draft" : "published"

          // Update URI in index
          await updateURI({
            uri: newURI,
            collection: collectionSlug,
            documentId: item.id,
            status: itemStatus,
            previousURI: oldURI,
          })

          // Update the actual document with new URI
          await payload.update({
            collection: collectionSlug as any,
            id: item.id,
            data: {
              uri: newURI,
            },
            overrideAccess: true,
            context: {
              preventHooks: true, // Prevent triggering URI generation hooks again
            },
          })

          // Track for batch cache invalidation
          const changes = detectChanges(
            { ...item, uri: newURI },
            { ...item, uri: oldURI }
          )

          batchUpdates.push({
            collection: collectionSlug,
            doc: { ...item, uri: newURI },
            changes,
          })

          result.documentsUpdated++
        }
      }
    }

    // Batch process cache invalidation
    if (batchUpdates.length > 0) {
      // Convert to batchRevalidate format
      const operations = batchUpdates.map(update => ({
        collection: update.collection,
        doc: update.doc,
        previousDoc: { ...update.doc, uri: update.changes.oldUri },
        action: "update" as const,
      }))

      const invalidationResults = await batchRevalidate({ operations })
      result.cacheEntriesCleared = invalidationResults.operations.reduce(
        (total: number, res: any) => total + (res.tagsInvalidated?.length || 0),
        0
      )
    }

    result.success = true
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error))
  }

  return result
}

/*************************************************************************/
/*  TEMPLATE CHANGE PROCESSING
/*************************************************************************/

export async function processTemplateChange(
  settingsId: string,
  additionalData?: DependentUpdatesAdditionalData
): Promise<DependentUpdatesResult> {
  const payload = await getPayload({ config: configPromise })

  const result: DependentUpdatesResult = {
    success: false,
    documentsUpdated: 0,
    redirectsCreated: 0,
    cacheEntriesCleared: 0,
    errors: [],
    operation: "template-change",
  }

  try {
    if (!additionalData?.templateChanges?.length) {
      return {
        ...result,
        success: true,
      }
    }

    // Collect all cache invalidation operations for batch processing
    const batchInvalidationOperations = []
    const cacheTagsToInvalidate = new Set<string>()

    // Process each collection with template changes
    for (const templateChange of additionalData.templateChanges) {
      const items = await getCollectionItemsForArchive(templateChange.collection)

      // Add collection-level cache tags (following established patterns)
      cacheTagsToInvalidate.add(`collection:${templateChange.collection}`)

      // Add URI index invalidation for this collection
      cacheTagsToInvalidate.add(`uri-index:${templateChange.collection}`)

      for (const item of items) {
        const oldURI = item.uri || ""
        const newURI = await routingEngine.generateURI({
          collection: templateChange.collection,
          slug: item.slug,
          data: item,
        })

        // Always update URI index with new template ID - this is crucial for template changes

        const itemStatus = item._status === "draft" ? "draft" : "published"

        await updateURI({
          uri: newURI || oldURI,
          collection: templateChange.collection,
          documentId: item.id,
          status: itemStatus,
          templateId: templateChange.newTemplate,
          previousURI: oldURI !== newURI ? oldURI : undefined,
        })

        // Add document-specific cache tags for invalidation (following established patterns)
        cacheTagsToInvalidate.add(`item:${templateChange.collection}:${item.id}`)
        if (item.slug) {
          cacheTagsToInvalidate.add(`item:${templateChange.collection}:${item.slug}`)
        }

        // Add URI-based cache tags (with proper normalization)
        if (oldURI) {
          const normalizedOldURI = routingEngine.normalizeURI(oldURI)
          cacheTagsToInvalidate.add(`uri:${normalizedOldURI}`)
        }
        if (newURI && newURI !== oldURI) {
          const normalizedNewURI = routingEngine.normalizeURI(newURI)
          cacheTagsToInvalidate.add(`uri:${normalizedNewURI}`)
        }

        // Prepare for batch cache invalidation
        batchInvalidationOperations.push({
          collection: templateChange.collection,
          doc: { ...item, uri: newURI || oldURI },
          previousDoc: { ...item, uri: oldURI },
          action: "update" as const,
        })

        result.documentsUpdated++
      }
    }

    // Perform batch cache invalidation
    if (batchInvalidationOperations.length > 0) {
      try {
        // Use direct cache tag invalidation for template changes
        const { revalidateTag } = await import("next/cache")

        // Invalidate all collected cache tags
        for (const tag of cacheTagsToInvalidate) {
          revalidateTag(tag)
        }

        result.cacheEntriesCleared = cacheTagsToInvalidate.size

        payload.logger.info(
          `Successfully invalidated ${result.cacheEntriesCleared} cache tags`
        )
      } catch (cacheError) {
        payload.logger.error(`Cache invalidation failed:`, cacheError)
        // Fallback to batchRevalidate if direct invalidation fails
        try {
          const invalidationResult = await batchRevalidate({
            operations: batchInvalidationOperations,
          })
          result.cacheEntriesCleared = invalidationResult.operations.reduce(
            (total: number, res: any) => total + (res.tagsInvalidated?.length || 0),
            0
          )
          payload.logger.info(
            `Fallback batchRevalidate completed, cleared ${result.cacheEntriesCleared} entries`
          )
        } catch (batchError) {
          payload.logger.error(`Fallback batchRevalidate also failed:`, batchError)
        }
      }
    }

    result.success = true
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error))
    payload.logger.error(`Template change failed:`, error)
  }

  return result
}

/*************************************************************************/
/*  TEMPLATE CONTENT CHANGE PROCESSING
/*************************************************************************/

export async function processTemplateContentChange(
  templateId: string,
  additionalData?: DependentUpdatesAdditionalData
): Promise<DependentUpdatesResult> {
  const payload = await getPayload({ config: configPromise })

  const result: DependentUpdatesResult = {
    success: false,
    documentsUpdated: 0,
    redirectsCreated: 0,
    cacheEntriesCleared: 0,
    errors: [],
    operation: "template-content-change",
  }

  try {
    // Find all content using this template by querying the URI index
    const uriIndexItems = await payload.find({
      collection: "uri-index",
      where: {
        templateId: { equals: templateId },
        status: { equals: "published" },
      },
      limit: 1000,
    })

    if (uriIndexItems.docs.length === 0) {
      payload.logger.info(
        `No content found using template ${templateId} (${additionalData?.templateName || "unknown"})`
      )
      result.success = true
      return result
    }

    payload.logger.info(
      `Found ${uriIndexItems.docs.length} items using template ${templateId} (${additionalData?.templateName || "unknown"}). Invalidating cache.`
    )

    // Collect all cache tags to invalidate
    const cacheTagsToInvalidate = new Set<string>()

    // Add template-specific cache tag
    cacheTagsToInvalidate.add(`template:${templateId}`)

    // Group by collection for efficient processing
    const itemsByCollection: Record<string, any[]> = {}

    for (const uriItem of uriIndexItems.docs) {
      const collection = uriItem.sourceCollection
      if (!itemsByCollection[collection]) {
        itemsByCollection[collection] = []
      }
      itemsByCollection[collection].push(uriItem)
    }

    // Process each collection
    for (const [collection, items] of Object.entries(itemsByCollection)) {
      // Add collection-level cache tags
      cacheTagsToInvalidate.add(`collection:${collection}`)

      for (const uriItem of items) {
        // Add document-specific cache tags
        cacheTagsToInvalidate.add(`item:${collection}:${uriItem.documentId}`)

        // Add URI-based cache tags
        if (uriItem.uri) {
          const normalizedURI = routingEngine.normalizeURI(uriItem.uri)
          cacheTagsToInvalidate.add(`uri:${normalizedURI}`)
        }

        result.documentsUpdated++
      }
    }

    // Perform cache invalidation
    try {
      const { revalidateTag } = await import("next/cache")

      // Invalidate all collected cache tags
      for (const tag of cacheTagsToInvalidate) {
        revalidateTag(tag)
      }

      result.cacheEntriesCleared = cacheTagsToInvalidate.size

      payload.logger.info(
        `Successfully invalidated ${result.cacheEntriesCleared} cache tags for template ${templateId} (${additionalData?.templateName || "unknown"})`
      )
    } catch (cacheError) {
      payload.logger.error(
        `Cache invalidation failed for template ${templateId}:`,
        cacheError
      )
      result.errors.push(`Cache invalidation failed: ${cacheError}`)
    }

    result.success = true
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error))
    payload.logger.error(
      `Template content change processing failed for template ${templateId}:`,
      error
    )
  }

  return result
}
