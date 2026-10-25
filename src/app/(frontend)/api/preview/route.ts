import type { PayloadRequest } from "payload"
import { getPayload } from "payload"
import { NextResponse, NextRequest } from "next/server"
import configPromise from "@payload-config"
import { draftMode } from "next/headers"
import { createRequestUrl } from "@/utilities/request-origin"
import { publicPreviewPath } from "@/utilities/preview-path"
import { isFrontendCollection } from "@/website/collections"

/*************************************************************************/
/*  PREVIEW API ROUTE - OPTIMIZED FOR STATIC GENERATION
/*************************************************************************/

export async function GET(request: NextRequest): Promise<Response> {
  const payload = await getPayload({ config: configPromise })
  const { searchParams } = request.nextUrl

  const path = searchParams.get("path")
  const collection = searchParams.get("collection")
  const previewSecret = searchParams.get("previewSecret")
  const documentId = searchParams.get("documentId")
  const isLivePreview = searchParams.get("livePreview") === "true"

  // Validate preview secret
  if (previewSecret !== process.env.PREVIEW_SECRET) {
    return new Response("You are not allowed to preview this page", { status: 403 })
  }

  if (!path || !collection) {
    return new Response("Insufficient search params", { status: 404 })
  }

  const publicPath = publicPreviewPath(path)
  if (!publicPath || !(await isFrontendCollection(collection))) {
    return new Response("This endpoint can only be used for relative previews", {
      status: 400,
    })
  }

  // Verify user authentication
  let user
  try {
    const authentication = await payload.auth({
      req: request as unknown as PayloadRequest,
      headers: request.headers,
    })
    user = authentication.user
  } catch (error) {
    payload.logger.error({ err: error }, "Error verifying token for live preview")
    return new Response("You are not allowed to preview this page", { status: 403 })
  }

  if (!user) {
    return new Response("You are not allowed to preview this page", { status: 403 })
  }

  const previewTarget = createRequestUrl(request, publicPath)
  previewTarget.searchParams.set("preview", "true")

  if (collection) {
    previewTarget.searchParams.set("previewCollection", collection)
  }

  if (documentId) {
    previewTarget.searchParams.set("previewDocumentId", documentId)
  }

  if (isLivePreview) {
    previewTarget.searchParams.set("livePreview", "true")
  }

  const response = NextResponse.redirect(previewTarget, 307)
  const previewMode = await draftMode()
  previewMode.enable()

  return response
}
