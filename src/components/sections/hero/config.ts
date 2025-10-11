import type { Block } from "payload"

import { link } from "@/components/fields/link/link"
import { defaultLexical } from "@/components/fields/rich-text/default-lexical"
import { sectionSettings } from "@/components/fields/section"

export const Hero: Block = {
  slug: "hero",
  interfaceName: "HeroBlock",
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
          name: "eyebrow",
          type: "text",
          label: "Eyebrow",
          admin: {
            placeholder: "Optional short label above the heading",
          },
        },
        {
          name: "heading",
          type: "text",
          required: true,
        },
        {
          name: "supportingText",
          type: "richText",
          editor: defaultLexical,
          admin: {
            description: "Use this for a short paragraph beneath the heading.",
          },
        },
        {
          name: "highlight",
          type: "textarea",
          admin: {
            rows: 3,
            description: "Optional highlight or USP line displayed below the main copy.",
          },
        },
      ],
    },
    {
      type: "collapsible",
      label: "Media",
      fields: [
        {
          name: "backgroundImage",
          type: "upload",
          relationTo: "media",
          admin: {
            description: "Optional background image that fills the hero.",
          },
          filterOptions: {
            mimeType: { contains: "image" },
          },
        },
      ],
    },
    {
      type: "collapsible",
      label: "Layout",
      fields: [
        {
          name: "size",
          type: "select",
          label: "Height",
          defaultValue: "large",
          options: [
            { label: "Full viewport", value: "full" },
            { label: "Large", value: "large" },
            { label: "Medium", value: "medium" },
            { label: "Compact", value: "small" },
          ],
        },
        {
          name: "alignment",
          type: "select",
          defaultValue: "left",
          options: [
            { label: "Left aligned", value: "left" },
            { label: "Centre aligned", value: "center" },
          ],
        },
      ],
    },
    {
      name: "buttons",
      type: "array",
      labels: {
        singular: "Button",
        plural: "Buttons",
      },
      admin: {
        description: "Optional call-to-action buttons displayed beneath the hero copy.",
      },
      fields: [
        link({
          optional: true,
          defaultAppearance: "button",
          overrides: {
            name: "button",
            label: "Button",
          },
        }),
      ],
    },
    sectionSettings(),
  ],
}
