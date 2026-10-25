import { redirect as navigate } from "next/navigation"
import { cache } from "@/website/cache"
import { getPayload as loadPayload } from "payload"
import configPromise from "@payload-config"
import type { CollectionSlug } from "payload"

/*************************************************************************/
/*  URI REDIRECT HANDLER
/*************************************************************************/

let currentRedirect = navigate
let currentGetPayload = loadPayload

export function setUriRedirectNavigator(handler?: typeof navigate): void {
  currentRedirect = handler ?? navigate
}

export function setUriRedirectPayloadAccessor(getter?: typeof loadPayload): void {
  currentGetPayload = getter ?? loadPayload
}

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
    currentRedirect(redirectItem.to.url)
  }

  // Handle internal document reference redirect
  let redirectUrl: string | null = null

  const resolvedReference = await resolveReferenceTarget(redirectItem.to?.reference)
  if (resolvedReference?.uri) {
    redirectUrl = resolvedReference.uri
  } else if (resolvedReference?.slug) {
    redirectUrl = `/${resolvedReference.slug}`
  }

  if (redirectUrl) {
    currentRedirect(redirectUrl)
  }

  // If we get here, redirect was found but couldn't be resolved
  // Return true to indicate redirect was attempted
  return true
}

async function resolveReferenceTarget(reference: any) {
  if (!reference) {
    return null
  }

  const collection = reference.relationTo as CollectionSlug | undefined
  if (!collection) {
    return null
  }

  const value = reference.value

  if (typeof value === "string") {
    // Most Payload redirects store document IDs as strings
    const document = await fetchDocumentById(collection, value)
    if (document) {
      return document
    }

    // Backward compat: treat as slug if ID lookup failed
    const documentBySlug = await cache.getBySlug(collection as any, value)
    if (documentBySlug) {
      return documentBySlug
    }
  } else if (typeof value === "object" && value !== null) {
    if (value.uri || value.slug) {
      return value
    }

    if (value.id) {
      const document = await fetchDocumentById(collection, value.id)
      if (document) {
        return document
      }
    }

    return value
  }

  return null
}

async function fetchDocumentById(collection: CollectionSlug, id: string) {
  if (!id) {
    return null
  }

  try {
    const payload = await currentGetPayload({ config: configPromise })
    const document = await payload.findByID({
      collection,
      id,
      depth: 2,
      overrideAccess: true,
    })

    return document || null
  } catch {
    return null
  }
}
