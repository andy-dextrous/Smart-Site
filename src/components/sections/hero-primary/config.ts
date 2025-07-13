import type { Block } from "payload"

import { link } from "@/payload/fields/link"

export const HeroPrimary: Block = {
  slug: "hero-primary",
  imageURL: "/api/media/file/home hero-600x561.png",
  admin: {
    group: "Page Headers",
  },
  fields: [
    {
      type: "collapsible",
      label: "Content",
      admin: {
        initCollapsed: false,
      },
      fields: [
        {
          name: "heading",
          type: "text",
          required: true,
        },
        {
          name: "content",
          type: "textarea",
          admin: {
            rows: 10,
          },
          label: false,
          required: true,
        },
        {
          name: "usp",
          type: "textarea",
          admin: {
            rows: 3,
            description:
              "The unique selling proposition text that appears below the hero content",
          },
          label: "USP Text",
          required: true,
        },
      ],
    },
    {
      type: "collapsible",
      label: "Background Image",
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: "backgroundImage",
          type: "upload",
          relationTo: "media",
          filterOptions: {
            mimeType: { contains: "image" },
          },
          admin: {
            description: "Optional background image for the hero section",
          },
        },
      ],
    },
    {
      type: "collapsible",
      label: "Buttons",
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: "buttons",
          type: "array",
          fields: [
            {
              name: "button",
              type: "group",
              fields: [link()],
            },
          ],
        },
      ],
    },
  ],
  interfaceName: "HeroPrimaryBlock",
}
