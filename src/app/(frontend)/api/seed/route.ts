import { getPayload } from "payload"
import { DynamicSeedManager } from "@/admin/payload/endpoints/seed"
import { createSeedProof, createSeedSiteId } from "@/admin/payload/endpoints/seed/site-identity"
import config from "@payload-config"
import { headers } from "next/headers"
import { userHasMinimumRole } from "@/admin/payload/access/roles"
import { getSmartSiteConfig } from "@/admin/config"

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

const DEFAULT_SITE_NAME = "Smart Site"

function getSeedIdentity() {
  const smartSiteConfig = getSmartSiteConfig()
  const siteName = smartSiteConfig.identity.siteName || DEFAULT_SITE_NAME
  const publicUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000"
  const payloadSecret = process.env.PAYLOAD_SECRET || ""
  const previewSecret = process.env.PREVIEW_SECRET || ""

  return {
    siteName,
    siteId: createSeedSiteId({
      payloadSecret,
      publicUrl,
      siteName,
    }),
    seedProof: createSeedProof({
      payloadSecret,
      previewSecret,
      publicUrl,
      siteName,
    }),
  }
}

function hasValidSeedProof(request: Request) {
  const seedIdentity = getSeedIdentity()
  const receivedSiteId = request.headers.get("x-smartsite-site-id")
  const receivedProof = request.headers.get("x-smartsite-seed-proof")

  return (
    Boolean(receivedSiteId) &&
    Boolean(receivedProof) &&
    receivedSiteId === seedIdentity.siteId &&
    receivedProof === seedIdentity.seedProof
  )
}

export async function GET(request: Request): Promise<Response> {
  if (!hasValidSeedProof(request)) {
    return Response.json(
      {
        success: false,
        message: "Seed handshake failed for this SmartSite project.",
      },
      { status: 403 },
    )
  }

  const payload = await getPayload({ config })
  const userCount = await payload.count({
    collection: "users",
  })
  const seedIdentity = getSeedIdentity()

  return Response.json({
    success: true,
    siteId: seedIdentity.siteId,
    siteName: seedIdentity.siteName,
    databaseEmpty: userCount.totalDocs === 0,
  })
}

export async function POST(request: Request): Promise<Response> {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()
  const seedIdentity = getSeedIdentity()

  if (!hasValidSeedProof(request)) {
    return Response.json(
      {
        success: false,
        message: "Seed handshake failed for this SmartSite project.",
      },
      { status: 403 },
    )
  }

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
    let eraseExisting = false
    let confirmErase = false
    try {
      const body = await request.json()
      if (typeof body?.blog === "boolean") blog = body.blog
      if (body?.eraseExisting === true) eraseExisting = true
      if (typeof body?.siteName === "string") siteName = body.siteName.trim()
      if (body?.confirmErase === true) confirmErase = true
    } catch {}

    if (eraseExisting && !confirmErase) {
      return Response.json(
        {
          success: false,
          message: "Seed aborted. Explicit erase confirmation is required before wiping existing data.",
          siteId: seedIdentity.siteId,
        },
        { status: 400 },
      )
    }

    if (!siteName || siteName.length === 0) {
      siteName = DEFAULT_SITE_NAME
      payload.logger.info(`Seed request did not include a siteName. Falling back to "${DEFAULT_SITE_NAME}".`)
    }

    payload.logger.info(
      `Starting ${eraseExisting ? "destructive " : ""}seed operation for "${siteName}" with profile: minimal${blog ? " (blog)" : ""}`
    )

    const seedManager = new DynamicSeedManager(payload, siteName)
    const startTime = Date.now()

    // Minimal-only seeding
    const result = await seedManager.seedDatabase({ blog, eraseExisting })

    if (!result.success) {
      throw new Error(`Seed operation failed: ${result.message}`)
    }

    const totalDuration = Date.now() - startTime

    payload.logger.info(`Seed operation completed successfully in ${totalDuration}ms`)

    return Response.json({
      success: true,
      message: `Database seeded successfully with minimal${blog ? " + blog" : ""} profile${eraseExisting ? " after clearing existing data" : ""}`,
      profile: "minimal",
      siteId: seedIdentity.siteId,
      stats: result.stats,
      timestamp: new Date().toISOString(),
      duration: totalDuration,
    })
  } catch (error: any) {
    payload.logger.error({ error }, "Seed operation failed")

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
