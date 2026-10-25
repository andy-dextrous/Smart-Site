import { getPayload, type PayloadRequest } from "payload"
import configPromise from "@payload-config"
import { revalidateTag as nextRevalidateTag } from "next/cache"
import { formatIdForRelationship } from "@/payload/db/id-utils"

let currentGetPayload = getPayload
let currentRevalidateTag = nextRevalidateTag

export function setRedirectPayloadAccessor(getter?: typeof getPayload): void {
  currentGetPayload = getter ?? getPayload
}

export function setRedirectRevalidate(revalidate?: typeof nextRevalidateTag): void {
  currentRevalidateTag = revalidate ?? nextRevalidateTag
}

/*************************************************************************/
/*  AUTOMATIC REDIRECT ENGINE
/*************************************************************************/

/**
 * Creates an automatic redirect from old URI to a document
 * Uses document relationships for pages/posts, custom URLs for other collections
 * Checks for conflicts with existing manual redirects
 * Safe operation - won't fail if redirect creation fails
 */
export async function createAutomaticRedirect(
  oldURI: string,
  collection: string,
  documentId: string,
  newURI: string,
  req?: PayloadRequest
): Promise<{ success: boolean; message: string }> {
  if (oldURI === "/")
    return { success: false, message: "The homepage never creates an automatic redirect" }
  const startTime = Date.now()

  try {
    const payload = req?.payload || (await currentGetPayload({ config: configPromise }))

    if (await hasManualRedirect(oldURI, req)) {
      return {
        success: false,
        message: `Manual redirect already exists for ${oldURI} - not overriding`,
      }
    }

    const existingAutoRedirect = await payload.find({
      collection: "redirects",
      req,
      overrideAccess: true,
      where: {
        and: [{ from: { equals: oldURI } }, { type: { equals: "automatic" } }],
      },
      limit: 1,
    })

    let redirectId: string | null = null

    const buildRedirectData = (): any => {
      if (collection === "pages") {
        return {
          to: {
            type: "reference",
            reference: {
              relationTo: "pages",
              value: formatIdForRelationship(documentId),
            },
          },
          type: "automatic",
          source: "uri-index",
        }
      } else if (collection === "posts") {
        return {
          to: {
            type: "reference",
            reference: {
              relationTo: "posts",
              value: formatIdForRelationship(documentId),
            },
          },
          type: "automatic",
          source: "uri-index",
        }
      } else {
        return {
          to: {
            type: "custom",
            url: newURI,
          },
          type: "automatic",
          source: "uri-index",
        }
      }
    }

    const redirectData = buildRedirectData()

    if (existingAutoRedirect.docs.length > 0) {
      const existing = existingAutoRedirect.docs[0]
      await payload.update({
        collection: "redirects",
        req,
        overrideAccess: true,
        id: existing.id,
        data: redirectData,
      })
      redirectId = existing.id
      payload.logger.info(
        `Updated automatic redirect: ${oldURI} → ${collection}/${documentId}`
      )
    } else {
      const result = await payload.create({
        collection: "redirects",
        req,
        overrideAccess: true,
        data: {
          from: oldURI,
          ...redirectData,
        },
      })
      redirectId = result.id
      payload.logger.info(
        `Created automatic redirect: ${oldURI} → ${collection}/${documentId}`
      )
    }

    // Redirect collection hooks persist refresh intent with the original request.
    // A publication worker suppresses those hooks and acknowledges its own final flush.

    const executionTime = Date.now() - startTime
    payload.logger.info(
      `Automatic redirect ${existingAutoRedirect.docs.length > 0 ? "updated" : "created"}: ${oldURI} → ${collection}/${documentId} (${executionTime}ms)`
    )

    return {
      success: true,
      message: `Automatic redirect ${existingAutoRedirect.docs.length > 0 ? "updated" : "created"}: ${oldURI} → ${collection}/${documentId}`,
    }
  } catch (error) {
    const payload = req?.payload || (await currentGetPayload({ config: configPromise }))
    payload.logger.error(
      { error, oldURI, collection, documentId },
      `Failed to create automatic redirect ${oldURI} → ${collection}/${documentId}`
    )

    if (req?.transactionID) throw error
    return {
      success: false,
      message: `Failed to create redirect: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

/*************************************************************************/
/*  CONFLICT DETECTION UTILITIES
/*************************************************************************/

/**
 * Check if a manual redirect exists for the given URI
 */
export async function hasManualRedirect(
  uri: string,
  req?: PayloadRequest
): Promise<boolean> {
  try {
    const payload = req?.payload || (await currentGetPayload({ config: configPromise }))

    const result = await payload.find({
      collection: "redirects",
      req,
      overrideAccess: true,
      where: {
        and: [{ from: { equals: uri } }, { type: { equals: "manual" } }],
      },
      limit: 1,
    })

    return result.docs.length > 0
  } catch (error) {
    if (req?.transactionID) throw error
    return false
  }
}

/**
 * Clean up automatic redirects that are no longer needed
 * (e.g., when content is deleted permanently)
 */
export async function cleanupAutomaticRedirect(
  uri: string,
  req?: PayloadRequest
): Promise<void> {
  try {
    const payload = req?.payload || (await currentGetPayload({ config: configPromise }))

    const redirectsToDelete: any[] = []

    const outboundRedirects = await payload.find({
      collection: "redirects",
      req,
      overrideAccess: true,
      where: {
        and: [{ from: { equals: uri } }, { type: { equals: "automatic" } }],
      },
      limit: 1,
    })

    redirectsToDelete.push(...outboundRedirects.docs)

    const inboundRedirects = await payload.find({
      collection: "redirects",
      req,
      overrideAccess: true,
      where: {
        and: [{ "to.url": { equals: uri } }, { type: { equals: "automatic" } }],
      },
      limit: 10,
    })

    redirectsToDelete.push(...inboundRedirects.docs)

    if (redirectsToDelete.length > 0) {
      const uniqueRedirects = redirectsToDelete.filter(
        (redirect, index, self) =>
          index === self.findIndex(item => item.id === redirect.id)
      )

      for (const redirectDoc of uniqueRedirects) {
        await payload.delete({
          collection: "redirects",
          req,
          overrideAccess: true,
          id: redirectDoc.id,
        })
      }

      payload.logger.info(
        `Cleaned up ${uniqueRedirects.length} automatic redirect(s) related to deleted content: ${uri}`
      )
    }
  } catch (error) {
    const payload = req?.payload || (await currentGetPayload({ config: configPromise }))
    payload.logger.error(
      { error, uri },
      `Failed to cleanup automatic redirect for ${uri}`
    )
    throw error
  }
}

/*************************************************************************/
/*  REDIRECT LOOP PREVENTION
/*************************************************************************/

/**
 * Clean up automatic redirects that would create loops
 * Example: If creating /insights → /blog, remove any existing /blog → * redirects
 */
export async function cleanupConflictingRedirects(
  targetURI: string,
  req?: PayloadRequest
): Promise<void> {
  const payload = req?.payload || (await currentGetPayload({ config: configPromise }))
  // Delete only automatic sources: a manually configured redirect retains precedence.
  while (true) {
    const batch = await payload.find({
      collection: "redirects",
      req,
      overrideAccess: true,
      depth: 0,
      where: {
        and: [{ from: { equals: targetURI } }, { type: { equals: "automatic" } }],
      },
      limit: 50,
    })
    for (const item of batch.docs)
      await payload.delete({
        collection: "redirects",
        id: item.id,
        req,
        overrideAccess: true,
      })
    if (batch.docs.length < 50) break
  }
}
