import { revalidateDocument } from "@/admin/lib/cache/revalidation"
import { updateURI, getTemplateIdForCollection } from "@/admin/lib/routing/index-manager"
import { isFrontendCollection } from "@/admin/payload/collections/frontend"
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

  const isPublished = doc._status === "published"
  if (context.disableRevalidate || !isPublished) return doc

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
    // Only update URI index if this is the published version
    // Draft saves should not affect the URI index status
    const shouldUpdateIndex = doc._status === "published"
    
    if (shouldUpdateIndex) {
      await updateURI({
        uri: doc.uri,
        collection: collection.slug,
        documentId: doc.id,
        status: "published", // Always use published for URI index
        previousURI: previousDoc?.uri,
        templateId: templateId || undefined,
        data: doc,
        originalDoc: previousDoc,
      })
      payload.logger.info(`Updated URI index for ${collection.slug}/${doc.id}`)
    }
  } catch (error) {
    payload.logger.error(
      `URI index update failed for ${collection.slug}/${doc.id}:`,
      error
    )
  }
}
