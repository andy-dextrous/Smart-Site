"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import SmoothScrollProvider from "@/providers/gsap"
import GlobalAnimationsProvider from "@/providers/gsap/global-animations"

type ProvidersProps = {
  children: React.ReactNode
  enableDarkMode?: boolean
}

export default function Providers({ children, enableDarkMode = true }: ProvidersProps) {
  return (
    <ThemeProvider enableDarkMode={enableDarkMode}>
      <GSAP>{children}</GSAP>
    </ThemeProvider>
  )
}

const ThemeProvider = ({
  children,
  enableDarkMode,
}: {
  children: React.ReactNode
  enableDarkMode: boolean
}) => {
  if (!enableDarkMode) {
    return (
      <NextThemesProvider
        attribute="class"
        defaultTheme="light"
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
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}

const GSAP = ({ children }: { children: React.ReactNode }) => {
  return (
    <SmoothScrollProvider>
      <GlobalAnimationsProvider>{children}</GlobalAnimationsProvider>
    </SmoothScrollProvider>
  )
}
