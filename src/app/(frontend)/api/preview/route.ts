import type { CollectionSlug, PayloadRequest } from "payload"
import { getPayload } from "payload"
import { NextResponse, NextRequest } from "next/server"
import configPromise from "@payload-config"

/*************************************************************************/
/*  PREVIEW API ROUTE - OPTIMIZED FOR STATIC GENERATION
/*************************************************************************/

export async function GET(request: NextRequest): Promise<Response> {
  const payload = await getPayload({ config: configPromise })
  const { searchParams } = request.nextUrl

  const path = searchParams.get("path")
  const collection = searchParams.get("collection") as CollectionSlug
  const previewSecret = searchParams.get("previewSecret")

  // Validate preview secret
  if (previewSecret !== process.env.PREVIEW_SECRET) {
    return new Response("You are not allowed to preview this page", { status: 403 })
  }

  if (!path || !collection) {
    return new Response("Insufficient search params", { status: 404 })
  }

  if (!path.startsWith("/")) {
    return new Response("This endpoint can only be used for relative previews", {
      status: 500,
    })
  }

  // Verify user authentication
  let user
  try {
    user = await payload.auth({
      req: request as unknown as PayloadRequest,
      headers: request.headers,
    })
  } catch (error) {
    payload.logger.error({ err: error }, "Error verifying token for live preview")
    return new Response("You are not allowed to preview this page", { status: 403 })
  }

  if (!user) {
    return new Response("You are not allowed to preview this page", { status: 403 })
  }

  // CRITICAL CHANGE: Instead of enabling draftMode, redirect with preview parameter
  // This keeps the response cacheable while enabling preview mode
  const previewUrl = `${path}?preview=true`

  const response = NextResponse.redirect(new URL(previewUrl, request.url), 307)
  response.cookies.set("__prerender_bypass", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 24 hours
  })

  return response
}
