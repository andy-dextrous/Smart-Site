import { queuePublication } from "@/website/publication/intent"
import { revalidateDocument } from "@/website/cache/revalidation"
import { deleteURI } from "@/website/routing/index-manager"
import { cleanupAutomaticRedirect } from "@/website/redirects/auto-redirects"
import { isWebsiteCollection } from "@/website/collection-metadata"
import { shouldPreventHooks } from "@/utilities/prevent-hooks"
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
  req,
  collection,
}) => {
  const { payload, context } = req
  if (shouldPreventHooks(payload, context)) {
    return doc
  }

  if (isWebsiteCollection(collection)) {
    try {
      await deleteURI(collection.slug, doc.id, req)

      if (doc.uri) {
        await cleanupAutomaticRedirect(doc.uri, req)
        payload.logger.info(
          `Cleaned up automatic redirects for deleted document: ${doc.uri}`
        )
      }

      if (collection.slug === "pages") {
        const settings = await payload.findGlobal({
          slug: "settings",
          req,
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
          } else if (
            "value" in relationObject &&
            typeof relationObject.value === "string"
          ) {
            homepageId = relationObject.value
          }
        }

        if (homepageId && homepageId === doc.id) {
          await payload.updateGlobal({
            slug: "settings",
            req,
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
        {
          error,
          collection: collection.slug,
          documentId: doc.id,
        },
        `URI index cleanup failed for ${collection.slug}/${doc.id}`
      )
      throw error
    }
  }

  await queuePublication(
    req,
    collection.slug === "pages" ? "routes" : "refresh",
    `${collection.slug}/${doc.id}`
  )

  return doc
}
