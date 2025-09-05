import { createLocalReq, getPayload } from "payload"
import { DynamicSeedManager } from "@/admin/payload/endpoints/seed"
import { type ProfileName } from "@/admin/payload/endpoints/seed/profiles"
import config from "@payload-config"
import { headers } from "next/headers"

export const maxDuration = 60 // This function can run for a maximum of 60 seconds

/*************************************************************************/
/*  SEED API ENDPOINT WITH PROFILE SUPPORT
/*
/*  This endpoint accepts an optional profile parameter:
/*  - "minimal" (default): Clean start with essentials only
/*  - "demo": Full showcase with all features
/*
/*  Usage:
/*  POST /api/seed                  - Uses minimal profile
/*  POST /api/seed { "profile": "demo" } - Uses demo profile
/*************************************************************************/

export async function POST(request: Request): Promise<Response> {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()

  // Check if database has any users
  const userCount = await payload.count({
    collection: "users",
  })

  // Authenticate by passing request headers
  const { user } = await payload.auth({ headers: requestHeaders })

  // Allow seed without auth only if database is completely empty (first-time setup)
  if (!user && userCount.totalDocs > 0) {
    return Response.json(
      { error: "You must be logged in to perform this action" },
      { status: 401 }
    )
  }
  
  // If no users exist, this is initial setup - allow seed to create first admin
  if (userCount.totalDocs === 0) {
    payload.logger.info("No users found - allowing initial seed to create first admin")
  }

  try {
    // Parse request body for profile parameter
    let profile: ProfileName | undefined
    try {
      const body = await request.json()
      profile = body.profile as ProfileName
      
      // Validate profile if provided
      if (profile && profile !== "minimal" && profile !== "demo") {
        payload.logger.warn(`Invalid profile "${profile}" provided, using default`)
        profile = undefined
      }
    } catch {
      // No body or invalid JSON - use default profile
      profile = undefined
    }

    payload.logger.info(`Starting seed operation with profile: ${profile || "minimal (default)"}`)

    const seedManager = new DynamicSeedManager(payload)
    const startTime = Date.now()

    // Seed with specified profile (defaults to minimal if not provided)
    const result = await seedManager.seedDatabase(profile)

    if (!result.success) {
      throw new Error(`Seed operation failed: ${result.message}`)
    }

    const totalDuration = Date.now() - startTime

    payload.logger.info(`Seed operation completed successfully in ${totalDuration}ms`)

    return Response.json({
      success: true,
      message: `Database seeded successfully with ${profile || "minimal"} profile`,
      profile: profile || "minimal",
      stats: result.stats,
      timestamp: new Date().toISOString(),
      duration: totalDuration,
    })
  } catch (error: any) {
    payload.logger.error("Seed operation failed:", error)

    return Response.json(
      {
        success: false,
        message: "Seed operation failed",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
