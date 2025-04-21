import { i18nRouter } from "next-i18n-router"
import { NextRequest, NextResponse } from "next/server"

import wildChildConfig from "@/wc.config"

export function middleware(request: NextRequest) {
  return wildChildConfig.i18n && typeof wildChildConfig.i18n === "object"
    ? i18nRouter(request, wildChildConfig.i18n)
    : NextResponse.next()
}

export const config = {
  matcher: "/((?!api|static|.*\\..*|_next).*)",
}
