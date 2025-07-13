import type React from "react"

import { cache } from "@/lib/cache"
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
  const redirects = await cache.getCollection("redirects")

  // Priority-based redirect lookup: Manual redirects win over automatic ones
  let redirectItem = redirects.find(
    (redirect: any) => redirect.from === url && redirect.type === "manual"
  )

  // If no manual redirect found, look for automatic redirect
  if (!redirectItem) {
    redirectItem = redirects.find(
      (redirect: any) => redirect.from === url && redirect.type === "automatic"
    )
  }

  // Fallback to any redirect if type field doesn't exist (backward compatibility)
  if (!redirectItem) {
    redirectItem = redirects.find((redirect: any) => redirect.from === url)
  }

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
