import type { GlobalConfig } from "payload"
import { revalidateSettings } from "./hooks/revalidateSettings"

export const Settings: GlobalConfig = {
  slug: "settings",
  access: {
    read: () => true,
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
          label: "Socials",
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "facebook",
                  label: "Facebook",
                  type: "text",
                },
                {
                  name: "instagram",
                  label: "Instagram",
                  type: "text",
                },
                {
                  name: "twitter",
                  label: "X (Twitter)",
                  type: "text",
                },
                {
                  name: "linkedin",
                  label: "LinkedIn",
                  type: "text",
                },
                {
                  name: "youtube",
                  label: "YouTube",
                  type: "text",
                },
              ],
            },
          ],
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
    afterChange: [revalidateSettings],
  },
}
