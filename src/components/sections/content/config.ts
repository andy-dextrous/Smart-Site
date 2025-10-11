import type { Block } from "payload"

import { defaultLexical } from "@/components/fields/rich-text/default-lexical"
import { sectionSettings } from "@/components/fields/section"
import { link } from "@/components/fields/link/link"

export const Content: Block = {
  slug: "content",
  interfaceName: "ContentBlock",
  admin: {
    group: "Content",
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
          name: "content",
          type: "richText",
          editor: defaultLexical,
          required: true,
        },
      ],
    },
    {
      type: "collapsible",
      label: "Layout",
      fields: [
        {
          name: "layout",
          type: "select",
          defaultValue: "stacked",
          options: [
            { label: "Stacked", value: "stacked" },
            { label: "Split columns", value: "split" },
            { label: "Multi-column", value: "columns" },
          ],
        },
        {
          name: "alignment",
          type: "select",
          defaultValue: "start",
          options: [
            { label: "Start", value: "start" },
            { label: "Center", value: "center" },
          ],
        },
        {
          name: "showMedia",
          type: "checkbox",
          defaultValue: false,
          label: "Display supporting media",
        },
      ],
    },
    {
      type: "collapsible",
      label: "Media",
      admin: {
        condition: data => Boolean(data?.showMedia),
      },
      fields: [
        {
          name: "media",
          type: "upload",
          relationTo: "media",
          required: true,
          filterOptions: {
            mimeType: { contains: "image" },
          },
        },
        {
          name: "mediaPosition",
          type: "select",
          defaultValue: "right",
          options: [
            { label: "Left", value: "left" },
            { label: "Right", value: "right" },
          ],
        },
      ],
    },
    {
      type: "collapsible",
      label: "Call to action",
      fields: [
        {
          name: "showButton",
          type: "checkbox",
          defaultValue: false,
        },
        link({
          optional: true,
          defaultAppearance: "button",
          overrides: {
            name: "button",
            label: "Call to action",
            admin: {
              condition: (_, siblingData) => Boolean(siblingData?.showButton),
              hideGutter: true,
            },
          },
        }),
      ],
    },
    sectionSettings(),
  ],
}
