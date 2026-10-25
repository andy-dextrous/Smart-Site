import { i18nRouter } from "next-i18n-router"
import { NextRequest, NextResponse } from "next/server"
import { getI18nConfig } from "@/website/features"

/*************************************************************************/
/*  PROXY - DRAFT MODE ROUTING & I18N
/*************************************************************************/

export function proxy(request: NextRequest) {
  const isDraftMode = request.cookies.get("__prerender_bypass")?.value
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin")
  const isApiRoute = request.nextUrl.pathname.startsWith("/api")
  const isPreviewPath =
    request.nextUrl.pathname === "/preview" ||
    request.nextUrl.pathname.startsWith("/preview/")
  const hasPreviewParam = request.nextUrl.searchParams.get("preview") === "true"
  const isLivePreview = request.nextUrl.searchParams.get("livePreview") === "true"

  if (
    (isDraftMode || hasPreviewParam) &&
    !isAdminRoute &&
    !isApiRoute &&
    !isPreviewPath
  ) {
    const previewUrl = request.nextUrl.clone()
    previewUrl.pathname = `/preview${request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname}`
    previewUrl.searchParams.delete("preview")

    if (isLivePreview) {
      previewUrl.searchParams.set("livePreview", "true")
    }

    return NextResponse.rewrite(previewUrl)
  }

  const i18n = getI18nConfig()

  if (i18n.enabled) {
    const response = i18nRouter(request as any, {
      locales: i18n.locales,
      defaultLocale: i18n.defaultLocale,
      localeCookie: i18n.localeCookie,
      prefixDefault: i18n.prefixDefaultLocale,
    }) as unknown

    if (response) {
      return response as NextResponse
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/((?!api|static|.*\\..*|_next).*)",
}
