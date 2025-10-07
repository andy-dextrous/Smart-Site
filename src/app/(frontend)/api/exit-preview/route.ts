import { NextRequest, NextResponse } from "next/server"

/*************************************************************************/
/*  EXIT PREVIEW API ROUTE
/*************************************************************************/

export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = request.nextUrl
  const redirectParam = searchParams.get("redirect") || "/"

  let redirectPath = "/"

  try {
    if (redirectParam.startsWith("/")) {
      const url = new URL(redirectParam, request.url)
      redirectPath = `${url.pathname}${url.search}`
    }
  } catch (error) {
    redirectPath = "/"
  }

  const response = NextResponse.redirect(new URL(redirectPath, request.url), 307)

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
