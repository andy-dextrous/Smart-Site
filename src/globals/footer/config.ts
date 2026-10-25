import type { GlobalConfig } from "payload"

import { link } from "@/components/fields/link/link"
import { afterFooterChange } from "@/hooks/globals/footer/after-change"

export const Footer: GlobalConfig = {
  slug: "footer",
  custom: { smartsite: { mcp: true } },
  access: {
    read: () => true,
  },
  admin: {
    hideAPIURL: process.env.NODE_ENV === "production",
  },
  fields: [
    {
      name: "menus",
      label: "Footer Menus",
      type: "array",
      fields: [
        {
          name: "title",
          type: "text",
          label: "Menu Title",
          required: true,
        },
        {
          name: "menuItems",
          label: "Menu Items",
          type: "array",
          fields: [link()],
          admin: {
            initCollapsed: true,
          },
        },
      ],
      maxRows: 10,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: "@/globals/footer/RowLabel#RowLabel",
        },
      },
    },
    {
      name: "legals",
      label: "Legal Links",
      type: "array",
      fields: [link()],
      maxRows: 10,
      admin: {
        initCollapsed: true,
      },
    },
  ],
  hooks: {
    afterChange: [afterFooterChange],
  },
}
