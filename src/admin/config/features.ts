import { getSmartSiteConfig } from "./index"
import type { I18nFeature } from "./defaults"

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
        "⚠️  smartsite.config.ts: features.i18n is enabled but no locales were provided. Defaulting to ['en']."
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

  const normalizedLocales = Array.from(new Set(locales.length ? locales : [defaultLocale]))

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
  const smartSiteConfig = getSmartSiteConfig()
  return normalizeI18nFeature(smartSiteConfig.features.i18n)
}
