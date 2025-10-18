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
          name: "preheading",
          type: "text",
          label: "Pre-heading",
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
          type: "textarea",
          admin: {
            rows: 4,
            description: "Optional supporting copy displayed beneath the heading.",
          },
        },
      ],
    },
    {
      type: "collapsible",
      label: "Media",
      admin: {
        initCollapsed: true,
      },
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
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          type: "row",
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
              admin: {
                width: "33%",
              },
            },
            {
              name: "alignment",
              type: "select",
              label: "Alignment",
              defaultValue: "left",
              options: [
                { label: "Left aligned", value: "left" },
                { label: "Centre aligned", value: "center" },
              ],
              admin: {
                width: "33%",
              },
            },
            {
              name: "visualStyle",
              type: "select",
              label: "Visual style",
              defaultValue: "classic",
              admin: {
                description:
                  "Choose how the hero renders its background. Image overlay applies gradient treatments and switches copy to light mode automatically.",
                width: "34%",
              },
              options: [
                { label: "Classic (no overlay)", value: "classic" },
                { label: "Image overlay", value: "image-overlay" },
                { label: "Gradient panel", value: "gradient" },
              ],
            },
          ],
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
          defaultValue: [],
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
      ],
    },
    sectionSettings(),
  ],
}
