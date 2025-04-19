import type { Block } from "payload"

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from "@payloadcms/richtext-lexical"
import { link } from "@/payload/fields/link"

export const HeroPrimary: Block = {
  slug: "hero-primary",
  admin: {
    group: "Hero Sections",
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
      name: "backgroundImage",
      type: "upload",
      relationTo: "media",
      admin: {
        description: "Optional background image for the hero section",
      },
    },
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
  interfaceName: "HeroPrimaryBlock",
}
