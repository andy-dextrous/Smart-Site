interface WildChildConfig {
  themeToggle: boolean
  gsap: boolean
  smoothScroll: boolean
  i18n: boolean | i18nConfig
}

interface i18nConfig {
  prefixDefaultLocale: boolean // example: false
  defaultLocale: string // example: "en"
  locales: string[] // example: ["en", "es"]
  localeCookie: string // example: "NEXT_LOCALE"
}

const wildChildConfig: WildChildConfig = {
  themeToggle: false,
  gsap: true,
  smoothScroll: false, // depends on gsap as prerequisite
  i18n: false,
}

export default wildChildConfig
