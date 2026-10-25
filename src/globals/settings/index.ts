import type { WebsiteCollection } from "@/website/collection-metadata"
import type { GlobalConfig } from "payload"
import { socialLinks } from "@/components/fields/social-links/social-links"
import { getTimeZoneOptions } from "@/utilities/timezones"
import { afterSettingsChange } from "@/hooks/globals/settings/after-change"
import { generateRoutingFields } from "@/utilities/routing"
import { authenticated } from "@/access/authenticated"
import { anyone } from "@/access/anyone"

export function createSettings(inventory: WebsiteCollection[]): GlobalConfig {
  return {
    slug: "settings",
    custom: { smartsite: { mcp: true } },
    access: {
      read: anyone,
      update: authenticated,
    },
    admin: {
      hideAPIURL: process.env.NODE_ENV === "production",
    },
    fields: [
      {
        type: "tabs",
        tabs: [
          {
            name: "general",
            label: "General",
            fields: [
              {
                name: "siteName",
                label: "Site Name",
                type: "text",
              },
              {
                name: "siteDescription",
                label: "Site Description",
                type: "text",
              },
            ],
          },
          {
            name: "social",
            label: "Social Media",
            fields: [socialLinks()],
          },
          {
            name: "locations",
            label: "Locations",
            fields: [
              {
                name: "locations",
                type: "array",
                minRows: 1,
                fields: [
                  {
                    name: "label",
                    label: "Location Label",
                    type: "text",
                  },
                  {
                    name: "street",
                    type: "text",
                  },
                  {
                    name: "city",
                    type: "text",
                  },
                  {
                    name: "zip",
                    type: "text",
                  },
                  {
                    name: "country",
                    type: "text",
                  },
                  {
                    name: "phone",
                    type: "text",
                  },
                  {
                    name: "email",
                    type: "text",
                  },
                  {
                    name: "googleMapsLink",
                    label: "Google Maps Link",
                    type: "text",
                    admin: {
                      description: "Full Google Maps URL for this location",
                    },
                  },
                  {
                    name: "timeZone",
                    label: "Time Zone",
                    type: "select",
                    options: getTimeZoneOptions(),
                    admin: {
                      description: "IANA time zone (e.g., Europe/London, Asia/Dubai)",
                    },
                  },
                  {
                    name: "latitude",
                    type: "number",
                  },
                  {
                    name: "longitude",
                    type: "number",
                  },
                ],
              },
            ],
          },
          {
            name: "routing",
            label: "Routing",
            fields: generateRoutingFields(inventory),
          },
          {
            name: "seo",
            label: "SEO",
            fields: [
              {
                name: "defaultMetaImage",
                label: "Default Meta Image",
                type: "upload",
                relationTo: "media",
                admin: {
                  description:
                    "Default image for social media sharing and search results",
                },
              },
              {
                name: "favicon",
                label: "Favicon",
                type: "upload",
                relationTo: "media",
                admin: {
                  description: "Site favicon (.ico, .png, or .svg)",
                },
              },
              {
                name: "organization",
                label: "Organization Data",
                type: "group",
                fields: [
                  {
                    name: "name",
                    label: "Organization Name",
                    type: "text",
                    admin: {
                      description: "Your business/organization name for structured data",
                    },
                  },
                  {
                    name: "type",
                    label: "Organization Type",
                    type: "select",
                    defaultValue: "Organization",
                    options: [
                      { label: "Organization", value: "Organization" },
                      { label: "Local Business", value: "LocalBusiness" },
                      { label: "Corporation", value: "Corporation" },
                      {
                        label: "Educational Organization",
                        value: "EducationalOrganization",
                      },
                      {
                        label: "Government Organization",
                        value: "GovernmentOrganization",
                      },
                      { label: "NGO", value: "NGO" },
                      { label: "Sports Organization", value: "SportsOrganization" },
                    ],
                  },
                  {
                    name: "logo",
                    label: "Organization Logo",
                    type: "upload",
                    relationTo: "media",
                    admin: {
                      description: "Logo for structured data (square format preferred)",
                    },
                  },
                  {
                    name: "description",
                    label: "Organization Description",
                    type: "textarea",
                    admin: {
                      description: "Brief description of your organization",
                    },
                  },
                  {
                    name: "foundingDate",
                    label: "Founding Date",
                    type: "date",
                    admin: {
                      description: "When your organization was founded",
                    },
                  },
                ],
              },
              {
                name: "verification",
                label: "Search Engine Verification",
                type: "group",
                fields: [
                  {
                    name: "googleSiteVerification",
                    label: "Google Site Verification",
                    type: "text",
                    admin: {
                      description: "Google Search Console verification code",
                    },
                  },
                  {
                    name: "bingSiteVerification",
                    label: "Bing Site Verification",
                    type: "text",
                    admin: {
                      description: "Bing Webmaster Tools verification code",
                    },
                  },
                  {
                    name: "yandexSiteVerification",
                    label: "Yandex Site Verification",
                    type: "text",
                    admin: {
                      description: "Yandex Webmaster verification code",
                    },
                  },
                  {
                    name: "pinterestSiteVerification",
                    label: "Pinterest Site Verification",
                    type: "text",
                    admin: {
                      description: "Pinterest domain verification code",
                    },
                  },
                ],
              },
              {
                name: "robots",
                label: "Robots Configuration",
                type: "group",
                fields: [
                  {
                    name: "enableRobotsTxt",
                    label: "Enable Custom Robots.txt",
                    type: "checkbox",
                    defaultValue: false,
                    admin: {
                      description: "Override default robots.txt with custom directives",
                    },
                  },
                  {
                    name: "customRobotsTxt",
                    label: "Custom Robots.txt",
                    type: "textarea",
                    admin: {
                      condition: (_, siblingData) =>
                        siblingData?.enableRobotsTxt === true,
                      description: "Custom robots.txt content",
                    },
                  },
                  {
                    name: "globalNoIndex",
                    label: "Global No Index",
                    type: "checkbox",
                    defaultValue: false,
                    admin: {
                      description:
                        "Prevent entire site from being indexed (development sites)",
                    },
                  },
                ],
              },
              {
                name: "social",
                label: "Social Media Defaults",
                type: "group",
                fields: [
                  {
                    name: "defaultOGImage",
                    label: "Default Open Graph Image",
                    type: "upload",
                    relationTo: "media",
                    admin: {
                      description:
                        "Default image for Facebook/Open Graph sharing (1200x630px)",
                    },
                  },
                  {
                    name: "defaultTwitterImage",
                    label: "Default Twitter Image",
                    type: "upload",
                    relationTo: "media",
                    admin: {
                      description: "Default image for Twitter sharing (1200x675px)",
                    },
                  },
                  {
                    name: "twitterSite",
                    label: "Twitter Site Handle",
                    type: "text",
                    admin: {
                      description: "Your Twitter handle (e.g., @yourcompany)",
                    },
                  },
                  {
                    name: "facebookAppId",
                    label: "Facebook App ID",
                    type: "text",
                    admin: {
                      description: "Facebook App ID for Open Graph insights",
                    },
                  },
                ],
              },
            ],
          },
          {
            name: "integrations",
            label: "Integrations",
            fields: [
              {
                type: "row",
                fields: [
                  {
                    name: "googleAnalytics",
                    label: "Google Analytics ID",
                    type: "text",
                  },
                  {
                    name: "googleTagManager",
                    label: "Google Tag Manager ID",
                    type: "text",
                  },
                ],
              },
              {
                name: "head",
                label: "<Head> Code",
                type: "code",
                admin: {
                  language: "html",
                },
              },
              {
                name: "bodyEnd",
                label: "<Body End> Code",
                type: "code",
                admin: {
                  language: "html",
                },
              },
            ],
          },
        ],
      },
    ],
    hooks: {
      afterChange: [afterSettingsChange],
    },
  }
}
