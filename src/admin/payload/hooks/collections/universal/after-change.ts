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
  req: { payload, context },
  collection,
}) => {
  if (shouldPreventHooks(payload, context)) {
    return doc
  }

  if (!isFrontendCollection(collection.slug)) return doc

  await updateURIIndex(doc, previousDoc, collection, payload)

  const previousStatus = previousDoc?._status
  const isCurrentlyPublished =
    doc._status === "published" || typeof doc._status === "undefined"
  const wasPreviouslyPublished = previousStatus === "published"

  if (context.disableRevalidate || (!isCurrentlyPublished && !wasPreviouslyPublished)) {
    return doc
  }

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

  return doc
}

/*************************************************************************/
/*  UTILITY FUNCTIONS
/*************************************************************************/

async function updateURIIndex(doc: any, previousDoc: any, collection: any, payload: any) {
  if (!doc.uri) return

  const templateId = await getTemplateIdForCollection(collection.slug, payload)

  try {
    const entryStatus = doc._status === "draft" ? "draft" : "published"

    await updateURI({
      uri: doc.uri,
      collection: collection.slug,
      documentId: doc.id,
      status: entryStatus,
      previousURI: previousDoc?.uri,
      templateId: templateId || undefined,
      data: doc,
      originalDoc: previousDoc,
    })

    payload.logger.info(
      `Updated URI index for ${collection.slug}/${doc.id} (status: ${entryStatus})`
    )
  } catch (error) {
    payload.logger.error(
      `URI index update failed for ${collection.slug}/${doc.id}:`,
      error
    )
  }
}
