"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import wildChildConfig from "@/wild-child.config"

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  if (!wildChildConfig.withColorTheme) {
    return children
  }

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
