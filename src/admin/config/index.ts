/*************************************************************************/
/*  UNIVERSAL SMARTSITE CONFIG GETTER
/*************************************************************************/

import { SMARTSITE_DEFAULTS, type SmartSiteConfig, type CollectionConfig, type UserConfig } from "./defaults"
import { deepMerge, deepFreeze } from "./deep-merge"
import userConfig from "@/smartsite.config"

let cachedConfig: SmartSiteConfig | null = null

/**
 * Get the merged SmartSite configuration
 * Merges user config with defaults and freezes the result
 * Works in server, client, and build contexts
 */
export function getSmartSiteConfig(): SmartSiteConfig {
  if (!cachedConfig) {
    // Deep merge user config with defaults
    const merged = deepMerge(SMARTSITE_DEFAULTS, userConfig as UserConfig)
    
    // Freeze to prevent mutations
    cachedConfig = deepFreeze(merged) as SmartSiteConfig
  }
  
  return cachedConfig
}

/*************************************************************************/
/*  CONVENIENCE ACCESSORS
/*************************************************************************/

/**
 * Get all frontend collections
 */
export function getFrontendCollections(): Record<string, CollectionConfig> {
  const config = getSmartSiteConfig()
  const frontend: Record<string, CollectionConfig> = {}
  
  for (const [slug, collection] of Object.entries(config.collections)) {
    if (collection.frontend && collection.enabled) {
      frontend[slug] = collection
    }
  }
  
  return frontend
}

/**
 * Check if a collection is a frontend collection
 */
export function isFrontendCollection(slug: string): boolean {
  const config = getSmartSiteConfig()
  const collection = config.collections[slug]
  return collection ? collection.frontend && collection.enabled : false
}

/**
 * Get collection configuration
 */
export function getCollectionConfig(slug: string): CollectionConfig | undefined {
  const config = getSmartSiteConfig()
  return config.collections[slug]
}

// Removed unnecessary getter functions - use getSmartSiteConfig() directly:
// - For media: getSmartSiteConfig().collections.media
// - For GSAP: getSmartSiteConfig().gsap  
// - For admin theme: getSmartSiteConfig().admin.theme
// - For extensions: getSmartSiteConfig().extensions

/*************************************************************************/
/*  RE-EXPORT TYPES
/*************************************************************************/

export type { SmartSiteConfig, UserConfig, CollectionConfig, MediaCollectionConfig, AdminTheme, GSAPConfig, FeaturesConfig } from "./defaults"