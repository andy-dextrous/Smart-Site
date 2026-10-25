import {
  revalidateTag as nextRevalidateTag,
  revalidatePath as nextRevalidatePath,
} from "next/cache"
import {
  getNavigationImpact,
  getCollectionsUsingArchive,
} from "@/lib/cache/navigation-detection"
import { routingEngine } from "@/lib/routing"
import { detectChanges, type ChangeDetection } from "@/lib/cache/change-detection"
import { getPayload as loadPayload } from "payload"
import configPromise from "@payload-config"
import { isFrontendCollection } from "@/lib/collections"

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

let currentRevalidateTag = nextRevalidateTag
let currentRevalidatePath = nextRevalidatePath
let currentGetPayload = loadPayload

function triggerRevalidateTag(tag: string): void {
  currentRevalidateTag(tag, { expire: 0 })
}

export function setRevalidationHandlers(options?: {
  revalidateTag?: typeof nextRevalidateTag | null
  revalidatePath?: typeof nextRevalidatePath | null
  getPayload?: typeof loadPayload | null
}): void {
  currentRevalidateTag = options?.revalidateTag ?? nextRevalidateTag
  currentRevalidatePath = options?.revalidatePath ?? nextRevalidatePath
  currentGetPayload = options?.getPayload ?? loadPayload
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
    const payload = await currentGetPayload({ config: configPromise })
    const result = await revalidateAllInternal("manual-clear-all")

    payload.logger.info(
      {
        tagsInvalidated: result.tagsInvalidated.length,
        pathsInvalidated: result.pathsInvalidated.length,
        duration: result.duration,
        reason: result.reason,
      },
      "🧹 Cache cleared successfully"
    )

    return {
      success: true,
      message: `All cache cleared successfully. Invalidated ${result.tagsInvalidated.length} tags in ${result.duration}ms`,
      result,
    }
  } catch (error) {
    const payload = await currentGetPayload({ config: configPromise })
    payload.logger.error({ error }, "Failed to clear all cache")
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
  triggerRevalidateTag(collectionTag)
  result.tagsInvalidated.push(collectionTag)

  // URI index invalidation for frontend collections
  const { isFrontendCollection } = await import("@/lib/collections")
  if (await isFrontendCollection(collection)) {
    const uriIndexTag = `uri-index:${collection}`
    triggerRevalidateTag(uriIndexTag)
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
  const itemTags = new Set<string>()
  if (doc.slug) {
    itemTags.add(`item:${collection}:${doc.slug}`)
  }
  if (doc.id) {
    itemTags.add(`item:${collection}:${doc.id}`)
  }

  itemTags.forEach(tag => {
    triggerRevalidateTag(tag)
    result.tagsInvalidated.push(tag)
  })

  /**
   * 2. ...And its matching URI
   */
  if (doc.uri) {
    const normalizedUri = routingEngine.normalizeURI(doc.uri)
    const uriTag = `uri:${normalizedUri}`
    triggerRevalidateTag(uriTag)
    result.tagsInvalidated.push(uriTag)

    /**
     * Revalidate the path itself
     */
    currentRevalidatePath(doc.uri)
    result.pathsInvalidated.push(doc.uri)
  }

  /**
   * 2b. Refresh collection and URI index tags so list queries stay fresh
   */
  const collectionTag = `collection:${collection}`
  if (!result.tagsInvalidated.includes(collectionTag)) {
    triggerRevalidateTag(collectionTag)
    result.tagsInvalidated.push(collectionTag)
  }

  if (await isFrontendCollection(collection)) {
    const uriIndexCollectionTag = `uri-index:${collection}`
    if (!result.tagsInvalidated.includes(uriIndexCollectionTag)) {
      triggerRevalidateTag(uriIndexCollectionTag)
      result.tagsInvalidated.push(uriIndexCollectionTag)
    }
  }

  /**
   * 3. Also invalidate the old URI if it changed
   */
  if (changes.uriChanged && changes.oldUri) {
    const oldNormalizedUri = routingEngine.normalizeURI(changes.oldUri)
    const oldUriTag = `uri:${oldNormalizedUri}`
    triggerRevalidateTag(oldUriTag)
    result.tagsInvalidated.push(oldUriTag)

    /**
     * Revalidate old path
     */
    currentRevalidatePath(changes.oldUri)
    result.pathsInvalidated.push(changes.oldUri)
  }

  /**
   * 3b. Also invalidate old slug-based cache entries when slug changes
   */
  if (changes.slugChanged && changes.oldSlug) {
    const oldSlugTag = `item:${collection}:${changes.oldSlug}`
    triggerRevalidateTag(oldSlugTag)
    result.tagsInvalidated.push(oldSlugTag)
  }

  /**
   * 4. Smart navigation detection - did this change affect the header or footer?
   */
  const navImpact = await getNavigationImpact(collection, doc, changes)

  if (navImpact.affectsHeader) {
    triggerRevalidateTag("global:header")
    result.tagsInvalidated.push("global:header")
  }

  if (navImpact.affectsFooter) {
    triggerRevalidateTag("global:footer")
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
      triggerRevalidateTag(collectionTag)
      result.tagsInvalidated.push(collectionTag)

      /**
       * Also invalidate URI index for affected collections
       */
      const uriIndexTag = `uri-index:${dep.collection}`
      triggerRevalidateTag(uriIndexTag)
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
      triggerRevalidateTag(parentTag)
      result.tagsInvalidated.push(parentTag)
    }

    if (changes.oldParent) {
      const oldParentTag = `item:pages:${changes.oldParent}`
      triggerRevalidateTag(oldParentTag)
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
  triggerRevalidateTag(globalTag)
  result.tagsInvalidated.push(globalTag)

  /**
   * 2. Settings changes have special handling
   */
  if (globalSlug === "settings") {
    triggerRevalidateTag("all")
    result.tagsInvalidated.push("all")
  }

  /**
   * 5. Header/Footer globals affect layout
   */
  if (globalSlug === "header" || globalSlug === "footer") {
    const layoutTag = `layout:${globalSlug}`
    triggerRevalidateTag(layoutTag)
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
  const payload = await currentGetPayload({ config: configPromise })
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
  triggerRevalidateTag("all")
  result.tagsInvalidated.push("all")
  payload.logger.info(`   ✓ Invalidated tag: all`)

  /**
   * 2. Revalidate key paths
   */
  const keyPaths = ["/", "/sitemap.xml"]
  for (const path of keyPaths) {
    currentRevalidatePath(path)
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
  const currentStatus = typeof doc._status === "string" ? doc._status : "published"

  if (currentStatus !== "published" && !changes.statusChanged) {
    return true
  }

  // Skip if no significant changes detected
  if (
    !changes.uriChanged &&
    !changes.statusChanged &&
    !changes.slugChanged &&
    !changes.parentChanged &&
    !changes.titleChanged &&
    !changes.contentChanged
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
