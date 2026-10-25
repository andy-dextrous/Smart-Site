import site from "@/site.config"
export type I18nFeature =
  | boolean
  | {
      defaultLocale: string
      locales: readonly string[]
      prefixDefaultLocale?: boolean
      localeCookie?: string
    }
export type SearchFeature =
  boolean | { enabled: boolean; mode?: "page" | "modal" | "hybrid" }

export type NormalizedI18nConfig = {
  enabled: boolean
  defaultLocale: string
  locales: string[]
  prefixDefaultLocale: boolean
  localeCookie: string
}

const DEFAULT_I18N: NormalizedI18nConfig = {
  enabled: false,
  defaultLocale: "en",
  locales: ["en"],
  prefixDefaultLocale: false,
  localeCookie: "NEXT_LOCALE",
}

export function normalizeI18nFeature(value: I18nFeature): NormalizedI18nConfig {
  if (value === false) {
    return { ...DEFAULT_I18N, enabled: false }
  }

  if (value === true) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "⚠️  site.config.ts: features.i18n is enabled but no locales were provided. Defaulting to ['en']."
      )
    }
    return { ...DEFAULT_I18N, enabled: true }
  }

  const {
    defaultLocale,
    locales,
    prefixDefaultLocale = DEFAULT_I18N.prefixDefaultLocale,
    localeCookie = DEFAULT_I18N.localeCookie,
  } = value

  const normalizedLocales = Array.from(
    new Set(locales.length ? locales : [defaultLocale])
  )

  if (!normalizedLocales.includes(defaultLocale)) {
    normalizedLocales.unshift(defaultLocale)
  }

  return {
    enabled: true,
    defaultLocale,
    locales: normalizedLocales,
    prefixDefaultLocale,
    localeCookie,
  }
}

export function getI18nConfig(): NormalizedI18nConfig {
  const smartSiteConfig = site
  return normalizeI18nFeature(smartSiteConfig.features.i18n)
}

export type NormalizedSearchConfig = {
  enabled: boolean
  mode: "page" | "modal" | "hybrid"
}

const DEFAULT_SEARCH_CONFIG: NormalizedSearchConfig = {
  enabled: true,
  mode: "page",
}

export function normalizeSearchFeature(value: SearchFeature): NormalizedSearchConfig {
  if (typeof value === "boolean") {
    return { ...DEFAULT_SEARCH_CONFIG, enabled: value }
  }

  if (!value) {
    return { ...DEFAULT_SEARCH_CONFIG }
  }

  const { enabled = true, mode = DEFAULT_SEARCH_CONFIG.mode } = value

  return {
    enabled,
    mode,
  }
}

export function getSearchConfig(): NormalizedSearchConfig {
  const smartSiteConfig = site
  const normalized = normalizeSearchFeature(smartSiteConfig.features.search)

  if (!normalized.enabled) {
    return normalized
  }

  return normalized
}
