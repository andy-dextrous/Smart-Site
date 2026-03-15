import { NextRequest, NextResponse } from "next/server"
import { createRequestUrl } from "@/admin/utilities/request-origin"

/*************************************************************************/
/*  EXIT PREVIEW API ROUTE
/*************************************************************************/

export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = request.nextUrl
  const redirectParam = searchParams.get("redirect") || "/"

  let redirectPath = "/"

  try {
    if (redirectParam.startsWith("/")) {
      const url = createRequestUrl(request, redirectParam)
      redirectPath = `${url.pathname}${url.search}`
    }
  } catch (error) {
    redirectPath = "/"
  }

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
