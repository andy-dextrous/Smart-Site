import type { Block } from "payload"

import { link } from "@/payload/fields/link"

export const HeroPrimary: Block = {
  slug: "hero-primary",
  admin: {
    group: "Hero Sections",
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
              fields: [
                {
                  name: "buttonType",
                  type: "select",
                  label: "Button type",
                  defaultValue: "primary",
                  options: ["primary", "secondary"],
                  admin: {
                    description: "Select the button type",
                  },
                },
                link(),
              ],
            },
          ],
        },
      ],
    },
  ],
  interfaceName: "HeroPrimaryBlock",
}
