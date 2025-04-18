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
      label: { singular: "Nav item", plural: "Nav items" },
      type: "array",
      fields: [
        {
          name: "item",
          label: false,
          type: "group",
          fields: [
            link(),
            {
              name: "hasDropdown",
              type: "checkbox",
              label: "Has dropdown menu",
            },
            {
              name: "subItems",
              label: {
                singular: "Sub-menu item",
                plural: "Sub-menu items",
              },
              type: "array",
              admin: {
                condition: (_, siblingData) => siblingData?.hasDropdown === true,
              },
              fields: [
                {
                  name: "child",
                  label: false,
                  type: "group",
                  fields: [
                    link(),
                    {
                      name: "hasChildren",
                      type: "checkbox",
                      label: "Has sub-dropdown menu",
                    },
                    {
                      name: "subItems",
                      type: "array",
                      label: "Sub-Dropdown Menu Items",
                      admin: {
                        condition: (_, siblingData) => siblingData?.hasChildren === true,
                      },
                      fields: [link()],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
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
