// Browser-safe presentation choices. Server configuration belongs in payload.config.ts.
const site = {
  identity: {
    siteName: "Smart Site",
    siteUrl: "http://localhost:3000",
  },
  features: {
    darkMode: false,
    i18n: false,
    analytics: false,
    search: {
      enabled: true,
      mode: "hybrid",
    },
    sitemaps: true,
  },
  gsap: {
    scrollTrigger: true,
    scrollSmoother: false,
    flip: false,
    draggable: false,
    morphSVG: false,
    drawSVG: false,
    splitText: false,
    customEase: false,
    physics2D: false,
    textPlugin: false,
    scrambleText: false,
    globalAnimations: true,
  },
  breadcrumbs: {
    enabled: true,
    homeLabel: "Home",
    separator: "slash",
    maxDepth: 0,
    showCurrent: true,
    className: "text-sm text-white/70",
  },
  images: {
    quality: {
      default: 85,
      thumbnail: 75,
      hero: 90,
    },
    breakpoints: {
      "3xl": 1920,
      "2xl": 1536,
      xl: 1280,
      lg: 1024,
      md: 768,
      sm: 640,
    },
  },
} as const
export default site
