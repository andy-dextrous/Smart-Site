const wildChildConfig = {
  name: "Wild Child Official",
  description: "Wild Child Official App Starter",
  url: process.env.NEXT_PUBLIC_URL,
  logo: process.env.NEXT_PUBLIC_URL + "/assets/logos/logo.svg",
  settings: {
    i18n: {
      active: false,
      prefixDefaultLocale: false,
      defaultLocale: "en",
      locales: ["en", "es"],
      localeCookie: "NEXT_LOCALE",
    },
  },
}

export default wildChildConfig
