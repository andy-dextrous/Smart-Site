import { routingEngine } from "@/admin/routing"
import { isFrontendCollection } from "@/admin/config/frontend"
import { shouldPreventHooks } from "@/admin/utilities/prevent-hooks"
import type { CollectionBeforeChangeHook } from "payload"

/*************************************************************************/
/*  UNIVERSAL BEFORE CHANGE HOOK
/*
/*  Handles URI generation for ALL frontend collections
/*
/*  This hook:
/*  - Generates URIs and attaches them to documents before save
/*  - Works for ALL frontend collections (pages, posts, services, etc.)
/*  - Sets error flags for recovery if URI generation fails
/*  - Uses direct database access (no caching) for data consistency
/*************************************************************************/

export const beforeUniversalChange: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req: { payload, context },
  collection,
}) => {
  if (
    !isFrontendCollection(collection.slug) ||
    !publishingOrSlugChanged(data, originalDoc)
  )
    return data

  if (shouldPreventHooks(payload, context)) {
    return data
  }

  const nextSlug =
    typeof data?.slug === "string" && data.slug.trim() !== "" ? data.slug : undefined

  try {
    const newURI = await routingEngine.generateURI({
      collection: collection.slug,
      slug: nextSlug || (typeof originalDoc?.slug === "string" ? originalDoc.slug : undefined),
      data,
      originalDoc,
    })

    data.uri = newURI
    data._uriGenerated = true
  } catch (error) {
    payload.logger.error(
      `URI generation failed for ${collection.slug}/${data.slug}:`,
      error
    )
    data._uriGenerationFailed = true
  }

  return data
}

/*************************************************************************/
/*  UTILITY FUNCTIONS
/*************************************************************************/

function publishingOrSlugChanged(data: any, originalDoc: any): boolean {
  const isPublishing = data._status === "published" && originalDoc?._status === "draft"

  const nextSlug =
    typeof data?.slug === "string" && data.slug.trim() !== "" ? data.slug : undefined
  const previousSlug =
    typeof originalDoc?.slug === "string" && originalDoc.slug.trim() !== ""
      ? originalDoc.slug
      : undefined

  const slugChanged = Boolean(nextSlug) && nextSlug !== previousSlug
  const parentChanged = data.parent !== originalDoc?.parent

  return isPublishing || slugChanged || parentChanged
}
