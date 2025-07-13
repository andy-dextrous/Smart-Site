import type { Block } from "payload"
import { link } from "@/payload/fields/link"

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from "@payloadcms/richtext-lexical"

export const TextImage: Block = {
  slug: "text-image",
  interfaceName: "TextImageBlock",
  admin: {
    group: "Content & Media",
  },
  fields: [
    {
      name: "heading",
      type: "text",
      required: true,
    },
    {
      name: "content",
      type: "richText",
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
      label: false,
      required: true,
    },
    {
      type: "collapsible",
      admin: {
        initCollapsed: true,
      },
      label: "Image",
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "image",
              type: "upload",
              relationTo: "media",
              required: true,
              filterOptions: {
                mimeType: { contains: "image" },
              },
              admin: {
                width: "80%",
              },
            },
            {
              name: "imagePosition",
              type: "select",
              options: ["left", "right"],
              required: true,
              defaultValue: "left",
              admin: {
                width: "20%",
              },
            },
          ],
        },
      ],
    },
    {
      type: "collapsible",
      admin: {
        initCollapsed: true,
      },
      label: "Buttons",
      fields: [
        {
          name: "buttons",
          type: "array",
          maxRows: 2,
          fields: [link()],
        },
      ],
    },
  ],
}
