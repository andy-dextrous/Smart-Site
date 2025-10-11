import { revalidateDocument } from "@/admin/cache/revalidation"
import { deleteURI } from "@/admin/routing/index-manager"
import { cleanupAutomaticRedirect } from "@/admin/redirects/auto-redirects"
import { isFrontendCollection } from "@/admin/config/frontend"
import { shouldPreventHooks } from "@/admin/utilities/prevent-hooks"
import type { CollectionAfterDeleteHook } from "payload"

/*************************************************************************/
/*  UNIVERSAL AFTER DELETE HOOK
/*
/*  Handles URI index cleanup for ALL frontend collections
/*
/*  This hook:
/*  - Removes URI index entries for deleted documents
/*  - Cleans up automatic redirects for deleted URIs
/*  - Handles revalidation for document deletion
/*  - Works for ALL frontend collections (pages, posts, services, etc.)
/*  - Uses direct database access (no caching) for data consistency
/*************************************************************************/

export const afterUniversalDelete: CollectionAfterDeleteHook = async ({
  doc,
  req: { payload, context },
  collection,
}) => {
  if (shouldPreventHooks(payload, context)) {
    return doc
  }

  if (isFrontendCollection(collection.slug)) {
    try {
      await deleteURI(collection.slug, doc.id)

      if (doc.uri) {
        await cleanupAutomaticRedirect(doc.uri)
        payload.logger.info(
          `Cleaned up automatic redirects for deleted document: ${doc.uri}`
        )
      }

      if (collection.slug === "pages") {
        const settings = await payload.findGlobal({
          slug: "settings",
          depth: 0,
          overrideAccess: true,
        })

        const homepageRelation = settings?.routing?.homepage
        let homepageId: string | undefined

        if (typeof homepageRelation === "string") {
          homepageId = homepageRelation
        } else if (homepageRelation && typeof homepageRelation === "object") {
          const relationObject = homepageRelation as { id?: unknown; value?: unknown }

          if ("id" in relationObject && typeof relationObject.id === "string") {
            homepageId = relationObject.id
          } else if ("value" in relationObject && typeof relationObject.value === "string") {
            homepageId = relationObject.value
          }
        }

        if (homepageId && homepageId === doc.id) {
          await payload.updateGlobal({
            slug: "settings",
            data: {
              routing: {
                ...(settings?.routing || {}),
                homepage: null,
              },
            },
            overrideAccess: true,
          })

          payload.logger.info(
            `Cleared homepage designation after deleting page ${doc.id}`
          )
        }
      }
    } catch (error) {
      payload.logger.error(
        `URI index cleanup failed for ${collection.slug}/${doc.id}:`,
        error
      )
    }
  }

  if (context.disableRevalidate) return doc

  try {
    await revalidateDocument({
      collection: collection.slug,
      doc,
      previousDoc: doc,
      action: "delete",
      logger: payload.logger,
    })
  } catch (error) {
    payload.logger.debug(
      `Smart revalidation failed for ${collection.slug} delete:`,
      error
    )
  }

  return doc
}
