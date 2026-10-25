import { validateSameOriginRequest } from "@/lib/request-guards"
import { regenerateURIs } from "@/lib/routing/index-manager"
import { getPayload } from "payload"
import config from "@payload-config"
import { headers } from "next/headers"

export const maxDuration = 300 // 5 minutes for large sites

/**
 * TEMPORARY API ROUTE - URI INDEX POPULATION
 *
 * This is a one-time migration endpoint to populate the URI index
 * with existing published content.
 *
 * Usage:
 *   POST http://localhost:3000/api/regenerate-uris
 *
 * Security: Authenticated admin/developer session + same-origin guard
 *
 * TODO: Remove this endpoint after successful migration
 */

export async function POST(): Promise<Response> {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()

  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user) {
    return Response.json(
      { success: false, message: "You must be logged in to perform this action" },
      { status: 401 }
    )
  }

  const csrfCheck = validateSameOriginRequest(requestHeaders)

  if (!csrfCheck.valid) {
    return Response.json(
      {
        success: false,
        message: "Request blocked for security reasons",
        details: csrfCheck.message,
      },
      { status: 403 }
    )
  }

  try {
    const stats = await regenerateURIs()

    return Response.json(
      {
        success: true,
        message: "URI index populated successfully",
        stats,
        timestamp: new Date().toISOString(),
        user: "email" in user ? user.email : undefined,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("💥 URI index population failed:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    return Response.json(
      {
        success: false,
        error: "URI index population failed",
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
