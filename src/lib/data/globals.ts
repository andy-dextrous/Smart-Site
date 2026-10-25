"use server"

import { cache } from "@/lib/cache"
import type { Config } from "@/payload-types"

type Global = keyof Config["globals"]

/**
 * Get Individual Global
 */
export async function getGlobal(slug: Global, depth = 0) {
  return await cache.getGlobal(slug, depth)
}

/**
 * Get Settings
 */
export async function getSettings() {
  return await cache.getGlobal("settings", 4)
}

/**
 * Get Homepage
 */
export async function getHomepage() {
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
