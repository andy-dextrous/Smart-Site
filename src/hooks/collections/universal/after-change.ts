import { queuePublication } from "@/website/publication/intent"
import { updateURI, getTemplateIdForCollection } from "@/website/routing/index-manager"
import { isWebsiteCollection } from "@/website/collection-metadata"
import { shouldPreventHooks } from "@/utilities/prevent-hooks"
import type { CollectionAfterChangeHook, PayloadRequest } from "payload"

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

  if (!isWebsiteCollection(collection)) return doc

  // Local API draft writes do not populate HTTP query flags. Inspect the main
  // document in the same transaction to distinguish a draft version from unpublish.
  if (collection.versions?.drafts && doc._status === "draft") {
    const stored = await payload.db.findOne({
      collection: collection.slug,
      where: { id: { equals: doc.id } },
      req,
    })
    if ((stored as { _status?: string } | null)?._status === "published") return doc
  }

  const autosave = getBooleanRequestFlag(req, "autosave")
  const draftSave = getBooleanRequestFlag(req, "draft")
  const savingDraftVersionOnly = (autosave || draftSave) && doc?._status !== "published"

  if (savingDraftVersionOnly) {
    return doc
  }

  // previousDoc can be the newest draft version, not the former public record.
  // The URI index is the publication state; consult it inside this transaction.
  const indexed = await payload.find({
    collection: "uri-index",
    req,
    where: {
      and: [
        { sourceCollection: { equals: collection.slug } },
        { documentId: { equals: String(doc.id) } },
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const previousIndex = indexed.docs[0]
  const live = !doc.deletedAt && (doc._status ?? "published") === "published"
  if (live || previousIndex?.status === "published") {
    await updateURIIndex(
      doc.deletedAt ? { ...doc, _status: "draft" } : doc,
      {
        ...previousDoc,
        _status: previousIndex?.status || "draft",
        uri: previousIndex?.uri || previousDoc?.uri,
      },
      collection,
      payload,
      context,
      req
    )
    await queuePublication(
      req,
      collection.slug === "pages" ? "routes" : "refresh",
      `${collection.slug}/${doc.id}`
    )
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
  payload: any,
  context: any,
  req: PayloadRequest
): Promise<boolean> {
  if (!doc.uri) return false

  /**
   * Only update URI index on explicit publish/unpublish events
   * Draft autosaves (even with slug changes) should NOT trigger URI index updates
   */
  const isPublishing =
    (doc._status ?? "published") === "published" && previousDoc?._status === "draft"
  const isUnpublishing =
    doc._status === "draft" && (previousDoc?._status ?? "published") === "published"
  const isPublishedUpdate =
    (doc._status ?? "published") === "published" &&
    (previousDoc?._status ?? "published") === "published"
  const isNewPublish = !previousDoc?.id && (doc._status ?? "published") === "published"

  if (!isPublishing && !isUnpublishing && !isPublishedUpdate && !isNewPublish) {
    return false
  }

  const templateId = await getTemplateIdForCollection(collection.slug, payload, req)

  try {
    const previouslyPublished = (previousDoc?._status ?? "published") === "published"

    const redirectPreference =
      typeof context?.createAutomaticRedirect === "boolean"
        ? context.createAutomaticRedirect
        : undefined

    const slugChanged = Boolean(
      doc?.slug &&
      previousDoc?.slug &&
      typeof doc.slug === "string" &&
      typeof previousDoc.slug === "string" &&
      doc.slug !== previousDoc.slug
    )

    await updateURI({
      req,
      uri: doc.uri,
      collection: collection.slug,
      documentId: doc.id,
      status: (doc._status ?? "published") === "published" ? "published" : "draft",
      previousURI: previousDoc?.uri,
      templateId: templateId || undefined,
      data: doc,
      originalDoc: previousDoc,
      skipRedirect:
        slugChanged && redirectPreference !== undefined
          ? !redirectPreference
          : !previouslyPublished,
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
    throw error
  }
}
