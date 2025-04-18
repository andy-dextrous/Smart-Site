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
    group: "Content Sections",
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
      name: "image",
      type: "upload",
      relationTo: "media",
      required: true,
    },
    {
      name: "imagePosition",
      type: "select",
      options: ["left", "right"],
      required: true,
    },
    {
      name: "buttons",
      type: "array",
      maxRows: 2,
      fields: [link()],
    },
  ],
}
