import { redirect } from "next/navigation"
import { cache } from "@/admin/cache"

/*************************************************************************/
/*  URI REDIRECT HANDLER
/*************************************************************************/

/**
 * Checks for redirects and executes them if found
 * Returns true if redirect was executed, false otherwise
 * This allows the caller to know whether to continue processing
 */
export async function handleURIRedirect(uri: string): Promise<boolean> {
  const redirectItem = await cache.getRedirect(uri)

  if (!redirectItem) {
    return false
  }

  // Log redirect for debugging (only in development)
  if (process.env.NODE_ENV === "development") {
    console.log(
      `🔄 Redirect found: ${uri} → (${redirectItem.type || "unknown"} redirect)`
    )
  }

  // Handle external URL redirect
  if (redirectItem.to?.url) {
    redirect(redirectItem.to.url)
  }

  // Handle internal document reference redirect
  let redirectUrl: string | null = null

  if (typeof redirectItem.to?.reference?.value === "string") {
    // Reference by slug - fetch document to get URI
    const collection = redirectItem.to?.reference?.relationTo
    const slug = redirectItem.to?.reference?.value

    const document = await cache.getBySlug(collection, slug)

    // Priority 1: Use URI field if available
    if (document?.uri) {
      redirectUrl = document.uri
    } else if (document?.slug) {
      // Fallback: Basic slug construction
      redirectUrl = `/${document.slug}`
    }
  } else if (typeof redirectItem.to?.reference?.value === "object") {
    // Direct reference object
    const doc = redirectItem.to?.reference?.value

    // Priority 1: Use URI field if available
    if (doc?.uri) {
      redirectUrl = doc.uri
    } else if (doc?.slug) {
      // Fallback: Basic slug construction
      redirectUrl = `/${doc.slug}`
    }
  }

  if (redirectUrl) {
    redirect(redirectUrl)
  }

  // If we get here, redirect was found but couldn't be resolved
  // Return true to indicate redirect was attempted
  return true
}
