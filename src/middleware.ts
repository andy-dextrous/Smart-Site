import { i18nRouter } from "next-i18n-router"
import { NextRequest, NextResponse } from "next/server"
import { getI18nConfig } from "@/admin/config/features"

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

  const i18n = getI18nConfig()

  if (i18n.enabled) {
    const response = i18nRouter(request, {
      locales: i18n.locales,
      defaultLocale: i18n.defaultLocale,
      localeCookie: i18n.localeCookie,
      prefixDefault: i18n.prefixDefaultLocale,
    })

    if (response) {
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/((?!api|static|.*\\..*|_next).*)",
}
