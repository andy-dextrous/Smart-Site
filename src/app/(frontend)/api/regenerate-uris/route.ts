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
 *   GET http://localhost:3000/api/populate-uri-index
 *
 * Security: Admin authentication required
 *
 * TODO: Remove this endpoint after successful migration
 */

export async function GET(): Promise<Response> {
  try {
    const stats = await regenerateURIs()

    // Return detailed results
    return Response.json(
      {
        success: true,
        message: "URI Index populated successfully",
        stats,
        timestamp: new Date().toISOString(),
        user: "no-auth",
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
  return GET()
}
