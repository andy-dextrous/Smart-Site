import { regenerateURIs } from "@/admin/routing/index-manager"
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
 *   GET http://localhost:3000/api/populate-uri-index
 *
 * Security: Admin authentication required
 *
 * TODO: Remove this endpoint after successful migration
 */

export async function GET(): Promise<Response> {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()

  // Authenticate by passing request headers
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user) {
    return Response.json(
      { error: "You must be logged in to perform this action" },
      { status: 401 }
    )
  }

  try {
    const stats = await regenerateURIs()

    // Return detailed results
    return Response.json(
      {
        success: true,
        message: "URI Index populated successfully",
        stats,
        timestamp: new Date().toISOString(),
        user: user.email,
      },
      {
        status: 200,
      }
    )
  } catch (error) {
    console.error("💥 URI Index Population failed:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    return Response.json(
      {
        success: false,
        error: "URI Index population failed",
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
      }
    )
  }
}

// Also support POST for tools that prefer it
export async function POST(): Promise<Response> {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()

  // Authenticate by passing request headers
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user) {
    return Response.json(
      { error: "You must be logged in to perform this action" },
      { status: 401 }
    )
  }

  try {
    const stats = await regenerateURIs()

    // Return detailed results
    return Response.json(
      {
        success: true,
        message: "URI Index populated successfully",
        stats,
        timestamp: new Date().toISOString(),
        user: user.email,
      },
      {
        status: 200,
      }
    )
  } catch (error) {
    console.error("💥 URI Index Population failed:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    return Response.json(
      {
        success: false,
        error: "URI Index population failed",
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
      }
    )
  }
}
