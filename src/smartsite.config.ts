import type { UserConfig } from "@/admin/config/defaults"

/*************************************************************************/
/*  SMART SITE CONFIG - USER OVERRIDES ONLY
/*************************************************************************/

const config: UserConfig = {
  admin: {
    meta: {
      title: "Admin | Smart Site",
      description: "Advanced admin panel",
      favicon: "/favicon.png",
    },
  },
  collections: {
    pages: {
      enabled: true,
      frontend: true,
    },
    posts: {
      enabled: true,
      frontend: true,
    },
    services: {
      enabled: true,
      frontend: true,
    },
    team: {
      enabled: true,
      frontend: true,
    },
    testimonials: {
      enabled: true,
    },
    media: {
      provider: "local",
    },
  },
  features: {
    analytics: false,
    darkMode: false,
    i18n: false,
    search: {
      enabled: true,
      mode: "hybrid",
    },
    sitemaps: true,
  },
  gsap: {
    scrollTrigger: true,
    scrollSmoother: false,
    splitText: false,
    globalAnimations: true,
  },
  extensions: {
    collections: [],
    blocks: [],
    globals: [],
    plugins: [],
  },
}

export default config
