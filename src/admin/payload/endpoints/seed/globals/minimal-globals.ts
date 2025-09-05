import type { Page } from "@/admin/payload/payload-types"

/*************************************************************************/
/*  MINIMAL GLOBALS
/*
/*  Creates minimal header, footer, and settings for minimal profile
/*************************************************************************/

export const minimalHeaderGlobal = (): any => {
  return {
    navItems: [
      {
        item: {
          link: {
            type: "custom",
            newTab: false,
            url: "/",
            label: "Home",
          },
          subItems: [],
        },
      },
      {
        item: {
          link: {
            type: "custom",
            newTab: false,
            url: "/contact",
            label: "Contact",
          },
          subItems: [],
        },
      },
    ],
  }
}

export const minimalFooterGlobal = (): any => {
  return {
    menus: [],  // No menus in minimal footer
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
      siteName: "Smart Site",
      siteDescription: "A modern website built with Smart Site",
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
        name: "Smart Site",
        type: "Organization",
        description: "A modern website built with Smart Site",
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