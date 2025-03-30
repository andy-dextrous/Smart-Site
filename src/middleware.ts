import { i18nRouter } from "next-i18n-router"
import { NextRequest, NextResponse } from "next/server"
import i18nConfig from "@/i18n"
import wildChildConfig from "@/wild-child.config"

export function middleware(request: NextRequest) {
  return wildChildConfig.settings.i18n.active
    ? i18nRouter(request, i18nConfig)
    : NextResponse.next()
}

export const config = {
  matcher: "/((?!api|static|.*\\..*|_next).*)",
}
