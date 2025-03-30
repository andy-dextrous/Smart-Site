import { ThemeProvider } from "next-themes"
import wildChildConfig from "@/wild-child.config"

export default function Providers({ children }: { children: React.ReactNode }) {
  return wildChildConfig.withColorTheme ? (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  ) : (
    children
  )
}
