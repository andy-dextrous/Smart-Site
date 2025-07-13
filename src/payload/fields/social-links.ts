import deepMerge from "@/utilities/deep-merge"
import type { Field } from "payload"
import { socialLinksDefault } from "./default-values/social-links"

/*************************************************************************/
/*  SOCIAL PLATFORM OPTIONS
/*************************************************************************/

const socialPlatformOptions = [
  { label: "Facebook", value: "facebook" },
  { label: "Instagram", value: "instagram" },
  { label: "LinkedIn", value: "linkedin" },
  { label: "YouTube", value: "youtube" },
  { label: "X (Twitter)", value: "twitter" },
  { label: "TikTok", value: "tiktok" },
  { label: "Pinterest", value: "pinterest" },
  { label: "Snapchat", value: "snapchat" },
  { label: "WhatsApp", value: "whatsapp" },
  { label: "Telegram", value: "telegram" },
  { label: "Discord", value: "discord" },
  { label: "Twitch", value: "twitch" },
  { label: "Reddit", value: "reddit" },
  { label: "GitHub", value: "github" },
  { label: "Email", value: "email" },
  { label: "Phone", value: "phone" },
  { label: "Website", value: "website" },
]

/*************************************************************************/
/*  SOCIAL LINKS FIELD
/*************************************************************************/

export const socialLinks = (overrides: Partial<Field> = {}): Field => {
  return deepMerge(
    {
      name: "socialLinks",
      label: "Social Links",
      type: "array",
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "platform",
              type: "select",
              label: "Platform",
              required: true,
              options: socialPlatformOptions,
              admin: {
                width: "40%",
              },
            },
            {
              name: "url",
              type: "text",
              label: "URL",
              required: true,
              admin: {
                width: "60%",
                placeholder: "https://...",
              },
            },
          ],
        },
        {
          name: "label",
          type: "text",
          label: "Custom Label (optional)",
          admin: {
            description: "Override default platform name",
          },
        },
      ],
      admin: {
        description: "Add social media links",
        initCollapsed: true,
        components: {
          RowLabel: "@/payload/fields/social-links-row-label#SocialLinksRowLabel",
        },
      },
      defaultValue: socialLinksDefault,
    },
    overrides
  )
}
