import { getPayload } from "payload"
import configPromise from "@payload-config"
import { revalidateTag } from "next/cache"

/*************************************************************************/
/*  AUTOMATIC REDIRECT ENGINE
/*************************************************************************/

/**
 * Creates an automatic redirect from old URI to new URI
 * Checks for conflicts with existing manual redirects
 * Prevents redirect loops by cleaning up conflicting automatic redirects
 * Safe operation - won't fail if redirect creation fails
 */
export async function createAutomaticRedirect(
  oldURI: string,
  newURI: string
): Promise<{ success: boolean; message: string }> {
  const startTime = Date.now()
  
  try {
    const payload = await getPayload({ config: configPromise })

    if (oldURI === newURI) {
      return { success: false, message: "URIs are identical, no redirect needed" }
    }

    if (await hasManualRedirect(oldURI)) {
      return {
        success: false,
        message: `Manual redirect already exists for ${oldURI} - not overriding`,
      }
    }

    await cleanupConflictingRedirects(newURI)

    const existingAutoRedirect = await payload.find({
      collection: "redirects",
      where: {
        and: [{ from: { equals: oldURI } }, { type: { equals: "automatic" } }],
      },
      limit: 1,
    })

    let redirectId: string | null = null

    if (existingAutoRedirect.docs.length > 0) {
      const existing = existingAutoRedirect.docs[0]
      await payload.update({
        collection: "redirects",
        id: existing.id,
        data: {
          to: {
            type: "custom",
            url: newURI,
          },
          type: "automatic",
          source: "uri-index",
        },
      })
      redirectId = existing.id
      payload.logger.info(`Updated automatic redirect: ${oldURI} → ${newURI}`)
    } else {
      const result = await payload.create({
        collection: "redirects",
        data: {
          from: oldURI,
          to: {
            type: "custom",
            url: newURI,
          },
          type: "automatic",
          source: "uri-index",
        },
      })
      redirectId = result.id
      payload.logger.info(`Created automatic redirect: ${oldURI} → ${newURI}`)
    }

    // Ensure the redirect caches are properly invalidated
    revalidateTag("collection:redirects")
    revalidateTag(`redirect:${oldURI}`) // Invalidate specific URI redirect cache
    
    const executionTime = Date.now() - startTime
    payload.logger.info(
      `Automatic redirect ${existingAutoRedirect.docs.length > 0 ? "updated" : "created"}: ${oldURI} → ${newURI} (${executionTime}ms)`
    )

    return {
      success: true,
      message: `Automatic redirect ${existingAutoRedirect.docs.length > 0 ? "updated" : "created"}: ${oldURI} → ${newURI}`,
    }
  } catch (error) {
    const payload = await getPayload({ config: configPromise })
    payload.logger.error(
      `Failed to create automatic redirect ${oldURI} → ${newURI}:`,
      error
    )

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
export async function hasManualRedirect(uri: string): Promise<boolean> {
  try {
    const payload = await getPayload({ config: configPromise })

    const result = await payload.find({
      collection: "redirects",
      where: {
        and: [{ from: { equals: uri } }, { type: { equals: "manual" } }],
      },
      limit: 1,
    })

    return result.docs.length > 0
  } catch (error) {
    // If we can't check, assume no conflict to be safe
    return false
  }
}

/**
 * Clean up automatic redirects that are no longer needed
 * (e.g., when content is deleted permanently)
 */
export async function cleanupAutomaticRedirect(uri: string): Promise<void> {
  try {
    const payload = await getPayload({ config: configPromise })

    const redirectsToDelete: any[] = []

    const outboundRedirects = await payload.find({
      collection: "redirects",
      where: {
        and: [{ from: { equals: uri } }, { type: { equals: "automatic" } }],
      },
      limit: 1,
    })

    redirectsToDelete.push(...outboundRedirects.docs)

    const inboundRedirects = await payload.find({
      collection: "redirects",
      where: {
        and: [{ "to.url": { equals: uri } }, { type: { equals: "automatic" } }],
      },
      limit: 10,
    })

    redirectsToDelete.push(...inboundRedirects.docs)

    if (redirectsToDelete.length > 0) {
      const uniqueRedirects = redirectsToDelete.filter(
        (redirect, index, self) => index === self.findIndex(item => item.id === redirect.id)
      )

      await Promise.all(
        uniqueRedirects.map(async redirectDoc => {
          await payload.delete({
            collection: "redirects",
            id: redirectDoc.id,
          })

          revalidateTag(`redirect:${redirectDoc.from}`)
        })
      )

      revalidateTag("collection:redirects")

      payload.logger.info(
        `Cleaned up ${uniqueRedirects.length} automatic redirect(s) related to deleted content: ${uri}`
      )
    }
  } catch (error) {
    const payload = await getPayload({ config: configPromise })
    payload.logger.error(`Failed to cleanup automatic redirect for ${uri}:`, error)
  }
}

/*************************************************************************/
/*  REDIRECT LOOP PREVENTION
/*************************************************************************/

/**
 * Clean up automatic redirects that would create loops
 * Example: If creating /insights → /blog, remove any existing /blog → * redirects
 */
async function cleanupConflictingRedirects(targetURI: string): Promise<void> {
  try {
    const payload = await getPayload({ config: configPromise })

    // Find automatic redirects that start from our target URI
    const conflictingRedirects = await payload.find({
      collection: "redirects",
      where: {
        and: [{ from: { equals: targetURI } }, { type: { equals: "automatic" } }],
      },
      limit: 5,
    })
    
    // Log potential redirect chain detection
    if (conflictingRedirects.docs.length > 0) {
      payload.logger.warn(
        `⚠️ Detected potential redirect chain: Found ${conflictingRedirects.docs.length} redirects starting from ${targetURI}`
      )
    }

    if (conflictingRedirects.docs.length > 0) {
      const deletePromises = conflictingRedirects.docs.map(async redirect => {
        try {
          await payload.delete({
            collection: "redirects",
            id: redirect.id,
          })

          payload.logger.info(
            `Cleaned up conflicting automatic redirect to prevent loop: ${redirect.from} → ${redirect.to?.url || redirect.to}`
          )

          return redirect.from
        } catch (error) {
          payload.logger.error(
            `Failed to delete conflicting redirect ${redirect.id}:`,
            error
          )
          return null
        }
      })

      // Wait for all deletions to complete in parallel
      const results = await Promise.allSettled(deletePromises)
      const successfulDeletions = results.filter(
        result => result.status === "fulfilled" && result.value !== null
      ).length

      payload.logger.info(
        `Removed ${successfulDeletions}/${conflictingRedirects.docs.length} conflicting automatic redirects for ${targetURI}`
      )
    }

    revalidateTag(`redirect:${targetURI}`)
    revalidateTag("collection:redirects")
  } catch (error) {
    const payload = await getPayload({ config: configPromise })
    payload.logger.error(
      `Failed to cleanup conflicting redirects for ${targetURI}:`,
      error
    )
  }
}
