import { ThemeProvider as NextThemesProvider } from "next-themes"
import SmoothScrollProvider from "@/providers/gsap"
import GlobalAnimationsProvider from "@/providers/gsap/global-animations"

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <GSAP>{children}</GSAP>
    </ThemeProvider>
  )
}

const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
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
