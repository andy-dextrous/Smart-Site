import { isUnroutedDocument } from "@/website/routing/route-eligibility"
import { routingEngine } from "@/website/routing"
import { isWebsiteCollection } from "@/website/collection-metadata"
import { shouldPreventHooks } from "@/utilities/prevent-hooks"
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
  req,
  collection,
}) => {
  const { payload, context } = req
  if (!isWebsiteCollection(collection)) return data

  if (shouldPreventHooks(payload, context)) {
    return data
  }

  const nextSlug =
    typeof data?.slug === "string" && data.slug.trim() !== "" ? data.slug : undefined

  try {
    const slug =
      nextSlug || (typeof originalDoc?.slug === "string" ? originalDoc.slug : undefined)
    if (
      await isUnroutedDocument({
        req,
        collection: collection.slug,
        data: { ...originalDoc, ...data, slug },
        originalDoc,
      })
    )
      return data
    const newURI = await routingEngine.generateURI({
      collection: collection.slug,
      slug,
      data,
      originalDoc,
      req,
    })

    data.uri = newURI
    data._uriGenerated = true
  } catch (error) {
    payload.logger.error(
      { error, collection: collection.slug, slug: data.slug },
      `URI generation failed for ${collection.slug}/${data.slug}`
    )
    throw error
  }

  return data
}
