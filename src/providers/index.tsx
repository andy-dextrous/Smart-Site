"use client"

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"
import SmoothScrollProvider from "@/providers/gsap"
import GlobalAnimationsProvider from "@/providers/gsap/global-animations"
import { useEffect, useRef } from "react"

type ProvidersProps = {
  children: React.ReactNode
  enableDarkMode?: boolean
  initialTheme?: "light" | "dark"
}

export default function Providers({ children, enableDarkMode = true, initialTheme }: ProvidersProps) {
  return (
    <ThemeProvider enableDarkMode={enableDarkMode} initialTheme={initialTheme}>
      <GSAP>{children}</GSAP>
    </ThemeProvider>
  )
}

const ThemeProvider = ({
  children,
  enableDarkMode,
  initialTheme,
}: {
  children: React.ReactNode
  enableDarkMode: boolean
  initialTheme?: "light" | "dark"
}) => {
  if (!enableDarkMode) {
    return (
      <NextThemesProvider
        attribute="class"
        defaultTheme="light"
        forcedTheme="light"
        themes={["light"]}
        enableSystem={false}
        disableTransitionOnChange
      >
        {children}
      </NextThemesProvider>
    )
  }

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={initialTheme ?? "system"}
      enableSystem
      disableTransitionOnChange
    >
      <PayloadThemeSync desiredTheme={initialTheme} />
      {children}
    </NextThemesProvider>
  )
}

function PayloadThemeSync({ desiredTheme }: { desiredTheme?: "light" | "dark" }) {
  const { theme, setTheme } = useTheme()
  const lastCookieTheme = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (typeof window === "undefined") return

    function readCookieTheme() {
      const match = document.cookie.match(/(?:^|;\s*)payload-theme=(dark|light)(?:;|$)/)
      return match ? match[1] : undefined
    }

    function syncFromCookie(force = false) {
      const cookieTheme = readCookieTheme()
      if (!cookieTheme) return
      if (force || cookieTheme !== lastCookieTheme.current) {
        lastCookieTheme.current = cookieTheme
        if (cookieTheme !== theme) {
          setTheme(cookieTheme)
        }
      }
    }

    syncFromCookie(true)

    const handleFocus = () => syncFromCookie(false)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        syncFromCookie(false)
      }
    }

    window.addEventListener("focus", handleFocus)
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      window.removeEventListener("focus", handleFocus)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [setTheme, theme])

  useEffect(() => {
    if (!desiredTheme) return
    if (desiredTheme !== theme) {
      setTheme(desiredTheme)
    }
  }, [desiredTheme, theme, setTheme])

  return null
}

const GSAP = ({ children }: { children: React.ReactNode }) => {
  return (
    <SmoothScrollProvider>
      <GlobalAnimationsProvider>{children}</GlobalAnimationsProvider>
    </SmoothScrollProvider>
  )
}
