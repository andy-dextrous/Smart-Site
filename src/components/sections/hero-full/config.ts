import type { Block } from "payload"

import { link } from "@/payload/fields/link"

export const HeroFull: Block = {
  slug: "hero-full",
  imageURL: "/api/media/file/hero full-600x354.png",
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
      ],
    },
    {
      type: "collapsible",
      label: "Layout Options",
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: "size",
          type: "select",
          options: [
            {
              label: "Full Height (100vh)",
              value: "full",
            },
            {
              label: "Medium Height (60vh)",
              value: "md",
            },
            {
              label: "Small Height (40vh)",
              value: "sm",
            },
          ],
          defaultValue: "full",
          required: true,
        },
        {
          name: "colorScheme",
          type: "select",
          options: [
            {
              label: "Background Image",
              value: "background-image",
            },
            {
              label: "Dark",
              value: "dark",
            },
            {
              label: "White",
              value: "white",
            },
            {
              label: "Primary",
              value: "primary",
            },
            {
              label: "Secondary",
              value: "secondary",
            },
          ],
          defaultValue: "background-image",
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
  interfaceName: "HeroFullBlock",
}
