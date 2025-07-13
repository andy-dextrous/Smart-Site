import { cache } from "@/lib/cache"
import type { Config } from "@/payload/payload-types"

type Global = keyof Config["globals"]

/**
 * Get Individual Global
 */
export const getGlobal = (slug: Global, depth = 0) => cache.getGlobal(slug, depth)

/**
 * Get Settings
 */
export const getSettings = () => cache.getGlobal("settings", 4)

/**
 * Get Homepage
 */
export const getHomepage = async () => {
  try {
    const settings = await cache.getGlobal("settings", 5)
    const homepage = settings.routing?.homepage

    if (homepage?.slug) {
      return cache.getBySlug("pages", homepage.slug)
    }
  } catch (error) {
    console.error(error)
  }

  return null
}
