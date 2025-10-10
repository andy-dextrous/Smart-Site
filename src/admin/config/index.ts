/*************************************************************************/
/*  UNIVERSAL SMARTSITE CONFIG GETTER
/*************************************************************************/

import { SMARTSITE_DEFAULTS, type SmartSiteConfig, type CollectionConfig, type UserConfig } from "./defaults"
import { deepMerge, deepFreeze } from "./deep-merge"
import userConfig from "@/smartsite.config"
import { emitValidationWarnings, validateMergedConfig, validateUserConfig } from "./validator"
import * as extensions from "@/extensions"

let cachedConfig: SmartSiteConfig | null = null
let validatedUserConfig: UserConfig | null = null
const warnedFrontendDisabled = new Set<string>()

/**
 * Get the merged SmartSite configuration
 * Merges user config with defaults and freezes the result
 * Works in server, client, and build contexts
 */
export function getSmartSiteConfig(): SmartSiteConfig {
  if (process.env.NODE_ENV !== "production") {
    cachedConfig = null
    validatedUserConfig = null
  }

  if (!cachedConfig) {
    const overrides = validatedUserConfig ?? validateUserConfig(userConfig)
    validatedUserConfig = overrides

    // Deep merge user config with defaults
    const mergedCandidate = deepMerge(SMARTSITE_DEFAULTS, overrides)

    const validatedMerged = validateMergedConfig(mergedCandidate)
    emitValidationWarnings({ merged: validatedMerged, user: overrides })

    // Freeze to prevent mutations
    cachedConfig = deepFreeze(validatedMerged) as SmartSiteConfig
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
  const enabledExtensionCollections = new Set(config.extensions?.collections || [])
  
  for (const [slug, collection] of Object.entries(config.collections)) {
    if (collection.frontend && collection.enabled === false) {
      if (!warnedFrontendDisabled.has(slug)) {
        console.warn(
          `⚠️  smartsite.config.ts: Collection '${slug}' is marked as frontend but disabled. It will be skipped by routing and sitemaps.`
        )
        warnedFrontendDisabled.add(slug)
      }
      continue
    }

    if (collection.frontend && collection.enabled) {
      const isDefaultCollection = Object.prototype.hasOwnProperty.call(
        SMARTSITE_DEFAULTS.collections,
        slug
      )
      const isExtensionRegistered = Boolean(extensions.collections[slug])
      const isExtensionEnabled = enabledExtensionCollections.has(slug)

      if (
        !isDefaultCollection &&
        (!isExtensionRegistered || !isExtensionEnabled)
      ) {
        continue
      }

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

export type {
  SmartSiteConfig,
  UserConfig,
  CollectionConfig,
  MediaCollectionConfig,
  AdminTheme,
  GSAPConfig,
  FeaturesConfig,
  I18nConfig,
  I18nFeature,
} from "./defaults"
