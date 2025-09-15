// server-only - removed for type generation compatibility
import fs from "fs/promises"
import path from "path"
import type { SmartSiteConfig } from "./defaults"

/*************************************************************************/
/*  THEME INJECTION
/*************************************************************************/

export async function injectAdminThemeVariables(adminTheme: SmartSiteConfig["admin"]["theme"]) {
  if (!adminTheme) return
  
  const cssVariables = generateCSSVariables(adminTheme)
  
  const adminThemePath = path.join(
    process.cwd(), 
    "src/admin/css/theme-overrides.css"
  )
  
  const cssContent = `/* Auto-generated admin theme variables - DO NOT EDIT */
/* These only affect the Payload admin panel */

:root {
${cssVariables}
}`
  
  await fs.writeFile(adminThemePath, cssContent)
  console.log("✅ Admin theme variables injected")
}

/*************************************************************************/
/*  CSS VARIABLE GENERATION
/*************************************************************************/

function generateCSSVariables(theme: SmartSiteConfig["admin"]["theme"]): string {
  const lines: string[] = []
  
  if (theme.colors) {
    Object.entries(theme.colors).forEach(([key, value]) => {
      const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase()
      lines.push(`  --admin-${cssKey}: ${value};`)
    })
  }
  
  if (theme.layout) {
    Object.entries(theme.layout).forEach(([key, value]) => {
      const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase()
      lines.push(`  --admin-${cssKey}: ${value};`)
    })
  }
  
  if (theme.typography) {
    Object.entries(theme.typography).forEach(([key, value]) => {
      const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase()
      lines.push(`  --admin-${cssKey}: ${value};`)
    })
  }
  
  return lines.join("\n")
}