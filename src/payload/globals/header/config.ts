import type { GlobalConfig } from "payload"

import { link } from "@/payload/fields/link"
import { revalidateHeader } from "./hooks/revalidateHeader"

export const Header: GlobalConfig = {
  slug: "header",
  access: {
    read: () => true,
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
          RowLabel: "@/payload/globals/header/row-label#RowLabel",
        },
      },
    },
  ],
  hooks: {
    afterChange: [revalidateHeader],
  },
}
