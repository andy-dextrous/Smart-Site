import type React from "react"

import { cache } from "@/website/cache"
import { notFound, redirect } from "next/navigation"

interface Props {
  disableNotFound?: boolean
  url: string
}

/*************************************************************************/
/*  PAYLOAD REDIRECTS - URI-FIRST ARCHITECTURE WITH PRIORITY SYSTEM
/*************************************************************************/

/* This component helps us with SSR based dynamic redirects */
export const PayloadRedirects: React.FC<Props> = async ({ disableNotFound, url }) => {
  // Use the new cached redirect lookup for optimal performance
  const redirectItem = await cache.getRedirect(url)

  if (redirectItem) {
    // Log redirect type for debugging (only in development)
    if (process.env.NODE_ENV === "development") {
      console.log(
        `🔄 Redirect found: ${url} → (${redirectItem.type || "unknown"} redirect)`
      )
    }

    // External URL redirect
    if (redirectItem.to?.url) {
      redirect(redirectItem.to.url)
    }

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
  }

  if (disableNotFound) return null

  notFound()
}
