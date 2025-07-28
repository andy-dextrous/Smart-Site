/*************************************************************************/
/*  TYPES - LIVE IN ADMIN BOUNDARY
/*************************************************************************/

export interface SmartSiteSettings {
  gsap: boolean
  smoothScroll: boolean
  themeToggle: boolean
  i18n: boolean | i18nConfig
  gsapDevTools: boolean
  ai: boolean | aiConfig
  search: boolean
  analytics: boolean
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
  payload?: any // Full Payload config overrides/extensions
}

// Client config interface - client provides config
export interface SmartSiteClientConfig {
  settings?: Partial<SmartSiteSettings>
  payload?: any // Optional Payload config overrides/extensions
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
    payload: clientConfig.payload,
  }

  return finalConfig
}
