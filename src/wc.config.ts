const wildChildConfig: WildChildConfig = {
  themeToggle: false,
  gsap: false,
  smoothScroll: false,
  i18n: false,
  // i18n:{
  //   prefixDefaultLocale: false,
  //   defaultLocale: "en",
  //   locales: ["en", "es"],
  //   localeCookie: "NEXT_LOCALE",
  // }
}

export default wildChildConfig

interface WildChildConfig {
  themeToggle: boolean
  gsap: boolean
  smoothScroll: boolean
  i18n: boolean | i18nConfig
}

interface i18nConfig {
  prefixDefaultLocale: boolean
  defaultLocale: string
  locales: string[]
  localeCookie: string
}
