import { getSettings } from "@/lib/data/globals"

export async function generateRootLayoutMetadata() {
  const settings = await getSettings()

  return {
    description: settings.general?.siteDescription || "Smart Site",
    title: settings.general?.siteName || "Smart Site",
  }
}
