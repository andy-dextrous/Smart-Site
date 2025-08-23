import { NextRequest, NextResponse } from "next/server"

/*************************************************************************/
/*  MIDDLEWARE - DRAFT MODE ROUTING & I18N
/*************************************************************************/

export function middleware(request: NextRequest) {
  const isDraftMode = request.cookies.get("__prerender_bypass")?.value
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin")
  const isApiRoute = request.nextUrl.pathname.startsWith("/api")
  const isLivePreview = request.nextUrl.searchParams.get("livePreview") === "true"

  if (isDraftMode && !isAdminRoute && !isApiRoute) {
    const previewUrl = request.nextUrl.clone()
    previewUrl.searchParams.set("preview", "true")

    if (isLivePreview) {
      previewUrl.searchParams.set("livePreview", "true")
    }

    return NextResponse.rewrite(previewUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/((?!api|static|.*\\..*|_next).*)",
}
