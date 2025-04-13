import type { Block } from "payload"

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from "@payloadcms/richtext-lexical"

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
      // localized: true,
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
  ],
  interfaceName: "HeroPrimaryBlock",
}
