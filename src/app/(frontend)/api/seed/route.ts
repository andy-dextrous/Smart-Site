import { getPayload } from "payload"
import { DynamicSeedManager } from "@/admin/payload/endpoints/seed"
import config from "@payload-config"
import { headers } from "next/headers"
import { userHasMinimumRole } from "@/admin/payload/access/roles"

export const maxDuration = 60 // This function can run for a maximum of 60 seconds

/*************************************************************************/
/*  SEED API ENDPOINT (MINIMAL ONLY)
/*
/*  This starter seeds a minimal baseline only. The endpoint ignores any
/*  provided profile and always seeds the minimal profile.
/*
/*  Usage:
/*  POST /api/seed                  - Seeds minimal profile
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
  } else {
    if (!user || !userHasMinimumRole(user, "developer")) {
      return Response.json(
        { success: false, message: "Only developer accounts can seed the database" },
        { status: 403 }
      )
    }

    payload.logger.info(
      `Seed request approved for developer ${user.email} (${user.id})`
    )
  }

  try {
    let blog = true
    let siteName: string | undefined
    try {
      const body = await request.json()
      if (typeof body?.blog === "boolean") blog = body.blog
      if (typeof body?.siteName === "string") siteName = body.siteName.trim()
    } catch {}

    if ((!siteName || siteName.length === 0) && typeof process.env.SMARTSITE_SITE_NAME === "string") {
      const envSiteName = process.env.SMARTSITE_SITE_NAME.trim()
      if (envSiteName.length > 0) {
        siteName = envSiteName
      }
    }

    if (!siteName) {
      throw new Error("Seed request must include a siteName string")
    }

    payload.logger.info(
      `Starting seed operation for "${siteName}" with profile: minimal${blog ? " (blog)" : ""}`
    )

    const seedManager = new DynamicSeedManager(payload, siteName)
    const startTime = Date.now()

    // Minimal-only seeding
    const result = await seedManager.seedDatabase({ blog })

    if (!result.success) {
      throw new Error(`Seed operation failed: ${result.message}`)
    }

    const totalDuration = Date.now() - startTime

    payload.logger.info(`Seed operation completed successfully in ${totalDuration}ms`)

    return Response.json({
      success: true,
      message: `Database seeded successfully with minimal${blog ? " + blog" : ""} profile`,
      profile: "minimal",
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
