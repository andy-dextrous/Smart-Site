import type { Page } from "@/admin/payload/payload-types"

/*************************************************************************/
/*  MINIMAL GLOBALS
/*
/*  Creates minimal header, footer, and settings for minimal profile
/*************************************************************************/

type HeaderOptions = {
  includeInsights?: boolean
}

export const minimalHeaderGlobal = (options: HeaderOptions = {}): any => {
  const items: Array<{ url: string; label: string }> = [
    { url: "/", label: "Home" },
    { url: "/about", label: "About" },
  ]

  if (options.includeInsights) {
    items.push({ url: "/insights", label: "Insights" })
  }

  items.push({ url: "/contact", label: "Contact" })

  return {
    navItems: items.map(link => ({
      item: {
        link: {
          type: "custom",
          newTab: false,
          url: link.url,
          label: link.label,
        },
        subItems: [],
      },
    })),
  }
}

export const minimalFooterGlobal = (): any => {
  return {
    menus: [],
    legals: [
      {
        link: {
          type: "custom",
          newTab: false,
          url: "/privacy-policy",
          label: "Privacy Policy",
        },
      },
      {
        link: {
          type: "custom",
          newTab: false,
          url: "/terms",
          label: "Terms",
        },
      },
    ],
  }
}

export const minimalSettingsGlobal = (homePage: Page): any => {
  return {
    general: {
      siteName: "Your Company",
      siteDescription: "A fresh Smart Site starter ready for custom content.",
    },
    social: {
      socialLinks: [], // No social links in minimal
    },
    locations: {
      locations: [], // No locations in minimal
    },
    integrations: {
      googleAnalytics: null,
      googleTagManager: null,
      head: null,
      bodyEnd: null,
    },
    routing: {
      homepage: homePage.id,
      pagesDefaultTemplate: null,
      postsCollectionLabel: "Posts",
      postsArchivePage: null, // No archive page in minimal
      postsSingleTemplate: null,
      servicesCollectionLabel: "Services",
      servicesArchivePage: null, // No services in minimal
      servicesSingleTemplate: null,
    },
    seo: {
      organization: {
        name: "Your Company",
        type: "Organization",
        description: "A fresh Smart Site starter ready for custom content.",
        foundingDate: new Date().getFullYear().toString() + "-01-01",
      },
      verification: {
        googleSiteVerification: null,
        bingSiteVerification: null,
        yandexSiteVerification: null,
        pinterestSiteVerification: null,
      },
      robots: {
        enableRobotsTxt: true,
        customRobotsTxt: `User-agent: *\nAllow: /\n\nSitemap: /sitemap.xml`,
        globalNoIndex: false,
      },
      social: {
        twitterSite: null,
        facebookAppId: null,
      },
    },
  }
}
