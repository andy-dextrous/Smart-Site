import { ThemeProvider } from "@/providers/theme"
import GSAPProvider from "./gsap"

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <GSAPProvider>{children}</GSAPProvider>
    </ThemeProvider>
  )
}
