import { revalidateTag, revalidatePath } from "next/cache"
import { getNavigationImpact, getCollectionsUsingArchive } from "./navigation-detection"
import { routingEngine } from "@/admin/routing"
import { detectChanges, type ChangeDetection } from "./change-detection"
import { getPayload } from "payload"
import configPromise from "@payload-config"

/*************************************************************************/
/*  UNIVERSAL REVALIDATION ENGINE - TYPES & INTERFACES
/*************************************************************************/

export interface RevalidateOptions {
  collection: string
  doc: any
  previousDoc?: any
  action: "create" | "update" | "delete"
  logger?: any
}

export interface InvalidationResult {
  tagsInvalidated: string[]
  pathsInvalidated: string[]
  reason: string
  startTime: string
  endTime?: string
  duration?: number
}

export interface BatchInvalidationSummary {
  totalOperations: number
  uniqueTagsInvalidated: number
  pathsInvalidated: number
  totalDuration: number
  operations: InvalidationResult[]
}

export interface BatchRevalidateOptions {
  operations: RevalidateOptions[]
  logger?: any
}

/*************************************************************************/
/*  REVALIDATION SINGLE DOCUMENT
/*************************************************************************/

export async function revalidateDocument(
  options: RevalidateOptions
): Promise<InvalidationResult> {
  const { collection, doc, previousDoc, action = "update", logger } = options

  try {
    const changes = detectChanges(doc, previousDoc, action)

    if (shouldSkipInvalidation(doc, changes)) {
      return {
        tagsInvalidated: [],
        pathsInvalidated: [],
        reason: `skipped: ${collection}/${doc.slug || doc.id}`,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        duration: 0,
      }
    }

    /**
     * Use surgical invalidation for precise cache clearing
     */
    const result = await revalidateForDocumentChange(
      collection,
      doc,
      changes,
      "single-change",
      logger
    )

    logger?.info(`Cache revalidated: ${doc.uri || doc.slug}`, {
      tagsInvalidated: result.tagsInvalidated.length,
      pathsInvalidated: result.pathsInvalidated.length,
      duration: result.duration,
    })

    return result
  } catch (error) {
    // Silently handle revalidation errors to avoid noise during bulk operations
    logger?.debug(`Smart revalidation failed for ${collection}:`, error)
    throw error
  }
}

/*************************************************************************/
/*  REVALIDATION BATCH
/*************************************************************************/

export async function batchRevalidateDocuments(
  options: BatchRevalidateOptions
): Promise<BatchInvalidationSummary> {
  const { operations, logger } = options

  try {
    const updates: Array<{ collection: string; doc: any; changes: ChangeDetection }> = []

    for (const operation of operations) {
      const { collection, doc, previousDoc, action = "update" } = operation
      const changes = detectChanges(doc, previousDoc, action)

      if (!shouldSkipInvalidation(doc, changes)) {
        updates.push({ collection, doc, changes })
      }
    }

    // Use surgical batch invalidation
    const result = await revalidateForBatchChanges(updates, logger)

    return result
  } catch (error) {
    // Silently handle revalidation errors to avoid noise during bulk operations
    logger?.debug("Batch revalidation failed:", error)
    throw error
  }
}

/*************************************************************************/
/*  REVALIDATION GLOBAL
/*************************************************************************/

export async function revalidateGlobal(
  globalSlug: string,
  doc: any,
  previousDoc: any,
  logger?: any
): Promise<InvalidationResult> {
  try {
    const changes = detectChanges(doc, previousDoc, "update")

    const result = await revalidateForGlobalChange(
      globalSlug,
      doc,
      previousDoc,
      changes,
      logger
    )

    logger?.info(`Global revalidated: ${globalSlug}`, {
      tagsInvalidated: result.tagsInvalidated.length,
      pathsInvalidated: result.pathsInvalidated.length,
      duration: result.duration,
    })

    return result
  } catch (error) {
    // Silently handle revalidation errors to avoid noise during bulk operations
    logger?.debug(`Global revalidation failed for ${globalSlug}:`, error)
    throw error
  }
}

/*************************************************************************/
/*  REVALIDATION ALL
/*************************************************************************/

/**
 * Revalidate all cached data using surgical invalidation emergency mode
 */
export async function revalidateAll(): Promise<{
  success: boolean
  message: string
  result?: InvalidationResult
}> {
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await revalidateAllInternal("manual-clear-all")

    payload.logger.info(`🧹 Cache cleared successfully`, {
      tagsInvalidated: result.tagsInvalidated.length,
      pathsInvalidated: result.pathsInvalidated.length,
      duration: result.duration,
      reason: result.reason,
    })

    return {
      success: true,
      message: `All cache cleared successfully. Invalidated ${result.tagsInvalidated.length} tags in ${result.duration}ms`,
      result,
    }
  } catch (error) {
    const payload = await getPayload({ config: configPromise })
    payload.logger.error("Failed to clear all cache:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/*************************************************************************/
/*  REVALIDATION COLLECTION
/*************************************************************************/

/**
 * Revalidate specific collection
 *
 * This is used for collection-level invalidation, such as when a collection is updated.
 */
export async function revalidateCollection(
  collection: string,
  reason: string = "collection-update"
): Promise<InvalidationResult> {
  const startTime = new Date().toISOString()
  const result: InvalidationResult = {
    tagsInvalidated: [],
    pathsInvalidated: [],
    reason: `${reason}: ${collection}`,
    startTime,
  }

  // Collection-wide invalidation
  const collectionTag = `collection:${collection}`
  revalidateTag(collectionTag)
  result.tagsInvalidated.push(collectionTag)

  // URI index invalidation for frontend collections
  const { isFrontendCollection } = await import("@/admin/config/frontend")
  if (isFrontendCollection(collection)) {
    const uriIndexTag = `uri-index:${collection}`
    revalidateTag(uriIndexTag)
    result.tagsInvalidated.push(uriIndexTag)
  }

  const endTime = new Date().toISOString()
  result.endTime = endTime
  result.duration = new Date(endTime).getTime() - new Date(startTime).getTime()

  return result
}

/*************************************************************************/
/*  REVALIDATION SINGLE DOCUMENT
/*************************************************************************/

async function revalidateForDocumentChange(
  collection: string,
  doc: any,
  changes: ChangeDetection,
  context: "single-change" | "cascade-operation" = "single-change",
  logger?: any
): Promise<InvalidationResult> {
  const startTime = new Date().toISOString()
  const result: InvalidationResult = {
    tagsInvalidated: [],
    pathsInvalidated: [],
    reason: `${context}: ${collection}/${doc.slug || doc.id}`,
    startTime,
  }

  /**
   * 1. Always invalidate the specific document
   */
  const itemTag = `item:${collection}:${doc.slug || doc.id}`
  revalidateTag(itemTag)
  result.tagsInvalidated.push(itemTag)

  /**
   * 2. ...And its matching URI
   */
  if (doc.uri) {
    const normalizedUri = routingEngine.normalizeURI(doc.uri)
    const uriTag = `uri:${normalizedUri}`
    revalidateTag(uriTag)
    result.tagsInvalidated.push(uriTag)

    /**
     * Revalidate the path itself
     */
    revalidatePath(doc.uri)
    result.pathsInvalidated.push(doc.uri)
  }

  /**
   * 3. Also invalidate the old URI if it changed
   */
  if (changes.uriChanged && changes.oldUri) {
    const oldNormalizedUri = routingEngine.normalizeURI(changes.oldUri)
    const oldUriTag = `uri:${oldNormalizedUri}`
    revalidateTag(oldUriTag)
    result.tagsInvalidated.push(oldUriTag)

    /**
     * Revalidate old path
     */
    revalidatePath(changes.oldUri)
    result.pathsInvalidated.push(changes.oldUri)
  }

  /**
   * 4. Smart navigation detection - did this change affect the header or footer?
   */
  const navImpact = await getNavigationImpact(collection, doc, changes)

  if (navImpact.affectsHeader) {
    revalidateTag("global:header")
    result.tagsInvalidated.push("global:header")
  }

  if (navImpact.affectsFooter) {
    revalidateTag("global:footer")
    result.tagsInvalidated.push("global:footer")
  }

  /**
   * 5. Archive page cascade invalidation - if the archive page changes, all collections using it need to be invalidated.
   * Uses the collection: tag to invalidate all documents in the collection.
   */
  if (collection === "pages") {
    const dependentCollections = await getCollectionsUsingArchive(doc.id)
    for (const dep of dependentCollections) {
      const collectionTag = `collection:${dep.collection}`
      revalidateTag(collectionTag)
      result.tagsInvalidated.push(collectionTag)

      /**
       * Also invalidate URI index for affected collections
       */
      const uriIndexTag = `uri-index:${dep.collection}`
      revalidateTag(uriIndexTag)
      result.tagsInvalidated.push(uriIndexTag)
    }
  }

  /**
   * 6. Hierarchy-specific invalidation for pages - if the parent page changes, all child pages need to be invalidated.
   * Uses the item: tag to invalidate the parent page.
   */
  if (collection === "pages" && changes.parentChanged) {
    /**
     * Invalidate parent page cache (affects child listing)
     */
    if (changes.newParent) {
      const parentTag = `item:pages:${changes.newParent}`
      revalidateTag(parentTag)
      result.tagsInvalidated.push(parentTag)
    }

    if (changes.oldParent) {
      const oldParentTag = `item:pages:${changes.oldParent}`
      revalidateTag(oldParentTag)
      result.tagsInvalidated.push(oldParentTag)
    }
  }

  const endTime = new Date().toISOString()
  result.endTime = endTime
  result.duration = new Date(endTime).getTime() - new Date(startTime).getTime()

  /**
   * Summary logging
   */
  if (logger && result.tagsInvalidated.length > 0) {
    logger.info(`🔄 Cache invalidated for ${collection}/${doc.slug || doc.id}:`)
    logger.info(`   Tags: [${result.tagsInvalidated.join(", ")}]`)
    if (result.pathsInvalidated.length > 0) {
      logger.info(`   Paths: [${result.pathsInvalidated.join(", ")}]`)
    }
    logger.info(`   Duration: ${result.duration}ms`)
  }

  return result
}

/*************************************************************************/
/*  REVALIDATION BATCH
/*************************************************************************/

async function revalidateForBatchChanges(
  updates: Array<{ collection: string; doc: any; changes: ChangeDetection }>,
  logger?: any
): Promise<BatchInvalidationSummary> {
  const startTime = Date.now()
  const processedTags = new Set<string>()
  const processedPaths = new Set<string>()

  const revalidationPromises = updates.map(async update => {
    try {
      const result = await revalidateForDocumentChange(
        update.collection,
        update.doc,
        update.changes,
        "cascade-operation",
        logger
      )

      return {
        success: true,
        result,
        collection: update.collection,
        docId: update.doc.id || update.doc.slug,
      }
    } catch (error) {
      logger?.error(
        `Failed to revalidate ${update.collection}/${update.doc.id || update.doc.slug}:`,
        error
      )

      return {
        success: false,
        error,
        collection: update.collection,
        docId: update.doc.id || update.doc.slug,
        result: {
          tagsInvalidated: [],
          pathsInvalidated: [],
          reason: `failed-revalidation: ${update.collection}/${update.doc.id || update.doc.slug}`,
          startTime: new Date().toISOString(),
        } as InvalidationResult,
      }
    }
  })

  // Wait for all revalidations to complete in parallel
  const revalidationResults = await Promise.allSettled(revalidationPromises)

  // Process results and deduplicate tags/paths
  const results: InvalidationResult[] = []
  let successfulRevalidations = 0

  revalidationResults.forEach(promiseResult => {
    if (promiseResult.status === "fulfilled") {
      const { success, result } = promiseResult.value

      if (success) {
        successfulRevalidations++

        // Deduplicate tags
        result.tagsInvalidated = result.tagsInvalidated.filter(tag => {
          if (processedTags.has(tag)) return false
          processedTags.add(tag)
          return true
        })

        // Deduplicate paths
        result.pathsInvalidated = result.pathsInvalidated.filter(path => {
          if (processedPaths.has(path)) return false
          processedPaths.add(path)
          return true
        })
      }

      results.push(result)
    }
  })

  const totalDuration = Date.now() - startTime

  logger?.info(
    `✅ Revalidation completed: ${successfulRevalidations}/${updates.length} successful (${totalDuration}ms)`
  )

  return {
    totalOperations: updates.length,
    uniqueTagsInvalidated: processedTags.size,
    pathsInvalidated: processedPaths.size,
    totalDuration,
    operations: results,
  }
}

/*************************************************************************/
/*  REVALIDATION GLOBAL
/*************************************************************************/

/**
 * Revalidate global settings using surgical invalidation
 */
async function revalidateForGlobalChange(
  globalSlug: string,
  doc: any,
  previousDoc: any,
  changes: ChangeDetection,
  logger?: any
): Promise<InvalidationResult> {
  const startTime = new Date().toISOString()
  const result: InvalidationResult = {
    tagsInvalidated: [],
    pathsInvalidated: [],
    reason: `global-change: ${globalSlug}`,
    startTime,
  }

  /**
   * 1. Always invalidate the specific global
   */
  const globalTag = `global:${globalSlug}`
  revalidateTag(globalTag)
  result.tagsInvalidated.push(globalTag)

  /**
   * 2. Settings changes have special handling
   */
  if (globalSlug === "settings") {
    const { detectAllSettingsChanges } = await import(
      "@/admin/routing/dependency-detection"
    )
    const settingsChanges = detectAllSettingsChanges(previousDoc, doc)

    /**
     * 3. Homepage changes affect root path
     */
    if (settingsChanges.homepageChange.changed) {
      revalidatePath("/")
      result.pathsInvalidated.push("/")

      const rootUriTag = `uri:${routingEngine.normalizeURI("/")}`
      revalidateTag(rootUriTag)
      result.tagsInvalidated.push(rootUriTag)
    }

    /**
     * 4. Archive changes affect multiple collections
     */
    for (const archiveChange of settingsChanges.archiveChanges) {
      const collectionTag = `collection:${archiveChange.collection}`
      revalidateTag(collectionTag)
      result.tagsInvalidated.push(collectionTag)

      const uriIndexTag = `uri-index:${archiveChange.collection}`
      revalidateTag(uriIndexTag)
      result.tagsInvalidated.push(uriIndexTag)
    }

    /**
     * 5. Integration changes affect entire site layout
     */
    if (settingsChanges.integrationChanges) {
      // Integration code affects every page, so revalidate everything
      revalidateTag("all")
      result.tagsInvalidated.push("all")

      // Also revalidate key paths
      revalidatePath("/")
      result.pathsInvalidated.push("/")

      if (logger) {
        logger.info("Integration settings changed - full site revalidation triggered")
      }
    }

    /**
     * 6. Template changes affect multiple collections
     */
    for (const templateChange of settingsChanges.templateChanges) {
      const collectionTag = `collection:${templateChange.collection}`
      revalidateTag(collectionTag)
      result.tagsInvalidated.push(collectionTag)

      const uriIndexTag = `uri-index:${templateChange.collection}`
      revalidateTag(uriIndexTag)
      result.tagsInvalidated.push(uriIndexTag)
    }
  }

  /**
   * 5. Header/Footer globals affect layout
   */
  if (globalSlug === "header" || globalSlug === "footer") {
    const layoutTag = `layout:${globalSlug}`
    revalidateTag(layoutTag)
    result.tagsInvalidated.push(layoutTag)
  }

  const endTime = new Date().toISOString()
  result.endTime = endTime
  result.duration = new Date(endTime).getTime() - new Date(startTime).getTime()

  if (logger && result.tagsInvalidated.length > 0) {
    logger.info(`   Tags: [${result.tagsInvalidated.join(", ")}]`)
    if (result.pathsInvalidated.length > 0) {
      logger.info(`   Paths: [${result.pathsInvalidated.join(", ")}]`)
    }
  }

  return result
}

/*************************************************************************/
/*  REVALIDATION EMERGENCY
/*************************************************************************/

/**
 * Revalidate all cached data using surgical invalidation emergency mode
 */
async function revalidateAllInternal(
  reason: string = "emergency-clear"
): Promise<InvalidationResult> {
  const payload = await getPayload({ config: configPromise })
  const startTime = new Date().toISOString()
  const result: InvalidationResult = {
    tagsInvalidated: [],
    pathsInvalidated: [],
    reason: `emergency: ${reason}`,
    startTime,
  }

  payload.logger.info(`🧹 Starting cache clear: ${reason}`)

  /**
   * 1. Nuclear option - invalidate everything
   */
  revalidateTag("all")
  result.tagsInvalidated.push("all")
  payload.logger.info(`   ✓ Invalidated tag: all`)

  /**
   * 2. Revalidate key paths
   */
  const keyPaths = ["/", "/sitemap.xml"]
  for (const path of keyPaths) {
    revalidatePath(path)
    result.pathsInvalidated.push(path)
    payload.logger.info(`   ✓ Invalidated path: ${path}`)
  }

  const endTime = new Date().toISOString()
  result.endTime = endTime
  result.duration = new Date(endTime).getTime() - new Date(startTime).getTime()

  payload.logger.info(`🧹 Cache clear completed in ${result.duration}ms`)

  return result
}

/*************************************************************************/
/*  UTILITY FUNCTIONS
/*************************************************************************/

export function shouldSkipInvalidation(doc: any, changes: ChangeDetection): boolean {
  // Skip if document is draft and no status change
  if (doc._status !== "published" && !changes.statusChanged) {
    return true
  }

  // Skip if no significant changes detected
  if (
    !changes.uriChanged &&
    !changes.statusChanged &&
    !changes.slugChanged &&
    !changes.parentChanged &&
    !changes.titleChanged
  ) {
    return true
  }

  return false
}

export function getInvalidationPriority(
  changes: ChangeDetection
): "low" | "medium" | "high" {
  if (changes.uriChanged || changes.parentChanged) {
    return "high"
  }

  if (changes.statusChanged || changes.slugChanged || changes.titleChanged) {
    return "medium"
  }

  return "low"
}
