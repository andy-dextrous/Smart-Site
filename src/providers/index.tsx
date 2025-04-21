import { ThemeProvider as NextThemesProvider } from "next-themes"
import wildChildConfig from "@/wc.config"
import SmoothScrollProvider from "@/providers/gsap"

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <GSAP>{children}</GSAP>
    </ThemeProvider>
  )
}

const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { themeToggle: colorModeToggle } = wildChildConfig

  if (!colorModeToggle) {
    return children
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
  const { gsap } = wildChildConfig

  if (!gsap) {
    return children
  }

  return <SmoothScrollProvider>{children}</SmoothScrollProvider>
}
