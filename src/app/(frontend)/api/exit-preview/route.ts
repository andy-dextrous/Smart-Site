import { NextRequest, NextResponse } from "next/server"
import { createRequestUrl } from "@/lib/request-origin"
import { publicPreviewPath } from "@/lib/preview-path"

/*************************************************************************/
/*  EXIT PREVIEW API ROUTE
/*************************************************************************/

export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = request.nextUrl
  const redirectParam = searchParams.get("redirect") || "/"

  const redirectPath = publicPreviewPath(redirectParam) ?? "/"

  const response = NextResponse.redirect(createRequestUrl(request, redirectPath), 307)

  response.cookies.set({
    name: "__prerender_bypass",
    value: "",
    maxAge: 0,
    path: "/",
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })

  response.cookies.set({
    name: "__next_preview_data",
    value: "",
    maxAge: 0,
    path: "/",
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })

  return response
}
