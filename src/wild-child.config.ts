const url =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : process.env.NEXT_PUBLIC_URL

const wildChildConfig = {
  name: "Wild Child Official",
  description: "Wild Child Official App Starter",
  frontendUrl: url,
  logo: url + "/assets/logos/logo.svg",
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
