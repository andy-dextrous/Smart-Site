interface SmartSiteConfig {
  themeToggle: boolean
  gsap: boolean
  smoothScroll: boolean
  i18n: boolean | i18nConfig
  gsapDevTools: boolean
}

interface i18nConfig {
  prefixDefaultLocale: boolean // example: false
  defaultLocale: string // example: "en"
  locales: string[] // example: ["en", "es"]
  localeCookie: string // example: "NEXT_LOCALE"
}

const wildChildConfig: SmartSiteConfig = {
  themeToggle: false,
  gsap: true,
  smoothScroll: true, // depends on gsap as prerequisite
  i18n: false,
  gsapDevTools: true,
}

export default wildChildConfig
