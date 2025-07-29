/*************************************************************************/
/*  TYPES - LIVE IN ADMIN BOUNDARY
/*************************************************************************/

import { CollectionConfig, GlobalConfig, Block } from "payload"

// Default collection keys that can be disabled with boolean flags
export type DefaultCollectionKeys =
  | "team"
  | "services"
  | "testimonials"
  | "posts"
  | "categories"
  | "templates"
  | "pages"
  | "media"
  | "users"
  | "uri-index"

// Default global keys that can be disabled with boolean flags
export type DefaultGlobalKeys = "header" | "footer" | "settings"

// Default block keys that can be disabled with boolean flags
export type DefaultBlockKeys = "code" | "form" | "media-block"

// Override types allowing boolean flags for defaults
export type CollectionOverride = {
  [K in DefaultCollectionKeys]?: boolean
}

export type GlobalOverride = {
  [K in DefaultGlobalKeys]?: boolean
}

export type BlockOverride = {
  [K in DefaultBlockKeys]?: boolean
}

export interface SmartSiteSettings {
  gsap: boolean
  smoothScroll: boolean
  themeToggle: boolean
  i18n: boolean | i18nConfig
  gsapDevTools: boolean
  ai: boolean | aiConfig
  search: boolean
  analytics: boolean
  templateSupport: boolean
  sitemaps: boolean
}

export interface i18nConfig {
  prefixDefaultLocale: boolean
  defaultLocale: string
  locales: string[]
  localeCookie: string
}

export interface aiConfig {
  enabled?: boolean
  url?: string // Full URL: "http://localhost:4112" or "https://my-ai-backend.vercel.app"
}

export interface SmartSiteConfig {
  settings: SmartSiteSettings

  // Separate keys for easy boolean overrides
  collections?: (CollectionConfig | CollectionOverride)[]
  globals?: (GlobalConfig | GlobalOverride)[]
  blocks?: (Block | BlockOverride)[]

  // Keep payload for other Payload config (excluding collections, globals, blocks)
  payload?: Omit<any, "collections" | "globals" | "blocks">
}

// Client config interface - client provides config
export interface SmartSiteClientConfig {
  settings?: Partial<SmartSiteSettings>

  // Separate keys for easy boolean overrides
  collections?: (CollectionConfig | CollectionOverride)[]
  globals?: (GlobalConfig | GlobalOverride)[]
  blocks?: (Block | BlockOverride)[]

  // Keep payload for other Payload config (excluding collections, globals, blocks)
  payload?: Omit<any, "collections" | "globals" | "blocks">
}

/*************************************************************************/
/*  ADMIN DEFAULTS - MINIMAL DEFAULTS
/*************************************************************************/

const adminDefaults: Partial<SmartSiteConfig> = {
  settings: {
    gsap: true,
    smoothScroll: true,
    themeToggle: false,
    i18n: false,
    gsapDevTools: true,
    ai: {
      enabled: true,
      url: "http://localhost:4112",
    },
    search: true,
    analytics: true,
    templateSupport: true,
    sitemaps: true,
  },
}

/*************************************************************************/
/*  DEFINE CONFIG - MERGES CLIENT CONFIG WITH MINIMAL ADMIN DEFAULTS
/*************************************************************************/

export function defineConfig(clientConfig: SmartSiteClientConfig): SmartSiteConfig {
  // Create the final config by merging settings
  const finalConfig: SmartSiteConfig = {
    settings: {
      ...adminDefaults.settings,
      ...clientConfig.settings,
    } as SmartSiteSettings,
    collections: clientConfig.collections,
    globals: clientConfig.globals,
    blocks: clientConfig.blocks,
    payload: clientConfig.payload,
  }

  return finalConfig
}
