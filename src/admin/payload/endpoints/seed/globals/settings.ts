import type { Setting, Page, Template } from "@/admin/payload/payload-types"

type SettingsArgs = {
  homePage: Page
  servicesPage?: Page
  insightsPage?: Page
  aboutUsPage?: Page
  templates?: Template[]
}

export const settingsGlobal = ({
  homePage,
  servicesPage,
  insightsPage,
  aboutUsPage,
  templates = [],
}: SettingsArgs): any => {
  // Find templates by name and safely extract IDs
  const postTemplate = templates.find(t => t.name === "Post Template")
  const serviceTemplate = templates.find(t => t.name === "Service Page Template")

  // Safely extract IDs as numbers or null
  const postTemplateId = postTemplate?.id ? postTemplate.id : null
  const serviceTemplateId = serviceTemplate?.id ? serviceTemplate.id : null

  return {
    general: {
      siteName: "Smart Site",
      siteDescription:
        "AI-native website platform that transforms your website into an intelligent business partner. Create, optimize, and grow your business with AI-powered workflows.",
    },
    social: {
      socialLinks: [
        {
          platform: "linkedin",
          url: "https://linkedin.com/company/smart-site",
        },
        {
          platform: "twitter",
          url: "https://twitter.com/smartsite",
        },
        {
          platform: "instagram",
          url: "https://instagram.com/smartsite",
        },
      ],
    },
    locations: {
      locations: [
        {
          street: "Level 1, 123 Business Street",
          city: "Brisbane",
          zip: "4000",
          country: "Australia",
          phone: "+61 400 000 000",
          email: "andrew@wildcreative.com.au",
          googleMapsLink: "https://maps.google.com/maps?q=Brisbane,+Australia",
          latitude: -27.4698,
          longitude: 153.0251,
        },
      ],
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
      postsArchivePage: insightsPage ? insightsPage.id : null,
      postsSingleTemplate: postTemplateId,
      servicesCollectionLabel: "Service Offerings",
      servicesArchivePage: servicesPage ? servicesPage.id : null,
      servicesSingleTemplate: serviceTemplateId,
    },
    seo: {
      organization: {
        name: "Smart Site",
        type: "Organization",
        description:
          "AI-native website platform that transforms your website into an intelligent business partner.",
        foundingDate: "2023-01-01",
      },
      verification: {
        googleSiteVerification: null,
        bingSiteVerification: null,
        yandexSiteVerification: null,
        pinterestSiteVerification: null,
      },
      robots: {
        enableRobotsTxt: true,
        customRobotsTxt: `User-agent: *
Allow: /

Sitemap: https://smartsite.ai/sitemap.xml`,
        globalNoIndex: false,
      },
      social: {
        twitterSite: "@smartsite",
        facebookAppId: null,
      },
    },
  }
}
