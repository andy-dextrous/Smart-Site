import { defineConfig } from "@/admin/config"

// Client provides config without sections to avoid server-only imports
const smartSiteConfig = defineConfig({
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

  /*
   Add any payload overrides and extensions here:
   - Add new collections (custom post types etc)
   - Add new globals (new settings pages etc)
   - Extend or modify existing payload config
   */

  payload: {},
})

export default smartSiteConfig
