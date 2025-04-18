import type { GlobalConfig } from "payload"

import { link } from "@/payload/fields/link"
import { revalidateFooter } from "./hooks/revalidateFooter"

export const Footer: GlobalConfig = {
  slug: "footer",
  access: {
    read: () => true,
  },
  admin: {
    hideAPIURL: process.env.NODE_ENV === "production",
  },
  fields: [
    {
      name: "navItems",
      type: "array",
      fields: [link()],
      maxRows: 6,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: "@/payload/globals/footer/RowLabel#RowLabel",
        },
      },
    },
  ],
  hooks: {
    afterChange: [revalidateFooter],
  },
}
