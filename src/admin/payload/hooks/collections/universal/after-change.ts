import { revalidateDocument } from "@/admin/cache/revalidation"
import { updateURI, getTemplateIdForCollection } from "@/admin/routing/index-manager"
import { isFrontendCollection } from "@/admin/config/frontend"
import { shouldPreventHooks } from "@/admin/utilities/prevent-hooks"
import type { CollectionAfterChangeHook } from "payload"

/*************************************************************************/
/*  UNIVERSAL AFTER CHANGE HOOK
/*
/*  Handles URI index maintenance and revalidation for ALL frontend collections
/*
/*  This hook:
/*  - Updates URI index with new document URIs
/*  - Handles revalidation for published documents
/*  - Works for ALL frontend collections (pages, posts, services, etc.)
/*  - Uses direct database access (no caching) for data consistency
/*************************************************************************/

export const afterUniversalChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
  collection,
}) => {
  const { payload, context } = req

  if (!payload) {
    return doc
  }

  if (shouldPreventHooks(payload, context)) {
    return doc
  }

  if (!isFrontendCollection(collection.slug)) return doc

  const autosave = getBooleanRequestFlag(req, "autosave")
  const draftSave = getBooleanRequestFlag(req, "draft")
  const savingDraftVersionOnly = (autosave || draftSave) && doc?._status !== "published"

  if (savingDraftVersionOnly) {
    return doc
  }

  const uriIndexUpdated = await updateURIIndex(doc, previousDoc, collection, payload)

  /**
   * Only revalidate when the published version actually changes
   * Draft edits of published pages should NOT trigger cache revalidation
   */
  const isPublishing = doc._status === "published" && previousDoc?._status === "draft"
  const isUnpublishing = doc._status === "draft" && previousDoc?._status === "published"
  const isPublishedUpdate = doc._status === "published" && previousDoc?._status === "published"
  const isNewPublish = !previousDoc && doc._status === "published"

  const shouldRevalidate =
    !context.disableRevalidate &&
    (isPublishing || isUnpublishing || isPublishedUpdate || isNewPublish)

  if (shouldRevalidate) {
    try {
      await revalidateDocument({
        collection: collection.slug,
        doc,
        previousDoc,
        action: operation === "create" ? "create" : "update",
        logger: payload.logger,
      })
    } catch (error) {
      payload.logger.debug(`Smart revalidation failed for ${collection.slug}:`, error)
    }
  }

  return doc
}

/*************************************************************************/
/*  UTILITY FUNCTIONS
/*************************************************************************/

function getBooleanRequestFlag(req: any, key: string): boolean {
  if (!req) return false

  const { searchParams, query } = req

  if (typeof searchParams?.get === "function") {
    const value = searchParams.get(key)
    if (value !== null) {
      return isTruthyFlag(value)
    }
  }

  const rawQueryValue = query?.[key]

  if (Array.isArray(rawQueryValue)) {
    return rawQueryValue.some(value => isTruthyFlag(value))
  }

  if (rawQueryValue !== undefined) {
    return isTruthyFlag(rawQueryValue)
  }

  return false
}

function isTruthyFlag(value: unknown): boolean {
  if (typeof value === "string") {
    return ["true", "1", "yes", "on"].includes(value.toLowerCase())
  }

  if (typeof value === "boolean") {
    return value
  }

  if (typeof value === "number") {
    return value === 1
  }

  return false
}

async function updateURIIndex(
  doc: any,
  previousDoc: any,
  collection: any,
  payload: any
): Promise<boolean> {
  if (!doc.uri) return false

  /**
   * Only update URI index on explicit publish/unpublish events
   * Draft autosaves (even with slug changes) should NOT trigger URI index updates
   */
  const isPublishing = doc._status === "published" && previousDoc?._status === "draft"
  const isUnpublishing = doc._status === "draft" && previousDoc?._status === "published"
  const isPublishedUpdate = doc._status === "published" && previousDoc?._status === "published"
  const isNewPublish = !previousDoc && doc._status === "published"

  if (!isPublishing && !isUnpublishing && !isPublishedUpdate && !isNewPublish) {
    return false
  }

  const templateId = await getTemplateIdForCollection(collection.slug, payload)

  try {
    const previouslyPublished = previousDoc?._status === "published"

    await updateURI({
      uri: doc.uri,
      collection: collection.slug,
      documentId: doc.id,
      status: doc._status === "published" ? "published" : "draft",
      previousURI: previousDoc?.uri,
      templateId: templateId || undefined,
      data: doc,
      originalDoc: previousDoc,
      skipRedirect: !previouslyPublished,
    })

    payload.logger.info(
      `Updated URI index for ${collection.slug}/${doc.id} (status: ${doc._status})`
    )
    return true
  } catch (error) {
    payload.logger.error(
      `URI index update failed for ${collection.slug}/${doc.id}:`,
      error
    )
    return false
  }
}
