import type { Page } from "@/admin/payload/payload-types"

/*************************************************************************/
/*  MINIMAL GLOBALS
/*
/*  Creates minimal header, footer, and settings for minimal profile
/*************************************************************************/

type HeaderOptions = {
  includeInsights?: boolean
  pages?: any[]
}

export const minimalHeaderGlobal = (options: HeaderOptions = {}): any => {
  const { includeInsights = false, pages = [] } = options

  const homePage = pages.find((p: any) => p?.slug === "home")
  const aboutPage = pages.find((p: any) => p?.slug === "about")
  const insightsPage = pages.find((p: any) => p?.slug === "insights")
  const contactPage = pages.find((p: any) => p?.slug === "contact")

  const navItems: any[] = []

  if (homePage) {
    navItems.push({
      item: {
        link: {
          type: "reference",
          newTab: false,
          reference: {
            relationTo: "pages",
            value: homePage.id,
          },
          label: "Home",
        },
        subItems: [],
      },
    })
  }

  if (aboutPage) {
    navItems.push({
      item: {
        link: {
          type: "reference",
          newTab: false,
          reference: {
            relationTo: "pages",
            value: aboutPage.id,
          },
          label: "About",
        },
        subItems: [],
      },
    })
  }

  if (includeInsights && insightsPage) {
    navItems.push({
      item: {
        link: {
          type: "reference",
          newTab: false,
          reference: {
            relationTo: "pages",
            value: insightsPage.id,
          },
          label: "Insights",
        },
        subItems: [],
      },
    })
  }

  if (contactPage) {
    navItems.push({
      item: {
        link: {
          type: "reference",
          newTab: false,
          reference: {
            relationTo: "pages",
            value: contactPage.id,
          },
          label: "Contact",
        },
        subItems: [],
      },
    })
  }

  return {
    navItems,
  }
}

type FooterOptions = {
  pages?: any[]
}

export const minimalFooterGlobal = (options: FooterOptions = {}): any => {
  const { pages = [] } = options

  const privacyPage = pages.find((p: any) => p?.slug === "privacy-policy")
  const termsPage = pages.find((p: any) => p?.slug === "terms")

  const legals: any[] = []

  if (privacyPage) {
    legals.push({
      link: {
        type: "reference",
        newTab: false,
        reference: {
          relationTo: "pages",
          value: privacyPage.id,
        },
        label: "Privacy Policy",
      },
    })
  }

  if (termsPage) {
    legals.push({
      link: {
        type: "reference",
        newTab: false,
        reference: {
          relationTo: "pages",
          value: termsPage.id,
        },
        label: "Terms",
      },
    })
  }

  return {
    menus: [],
    legals,
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
