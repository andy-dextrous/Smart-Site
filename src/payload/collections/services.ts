import {
  HorizontalRuleFeature,
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from "@payloadcms/richtext-lexical"
import { slugField } from "../fields/slug"
import { CollectionConfig } from "payload"

export const Services: CollectionConfig = {
  slug: "services",
  admin: {
    description:
      "Services represent the core business offerings of the company that should have a page dedicated to them for converting specific leads and customers. They are a great addition for SEO and marketing.",
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "content",
      type: "richText",
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            HeadingFeature({ enabledHeadingSizes: ["h1", "h2", "h3", "h4"] }),
            FixedToolbarFeature(),
            InlineToolbarFeature(),
            HorizontalRuleFeature(),
          ]
        },
      }),
      label: false,
      required: true,
    },
    {
      name: "heroImage",
      type: "upload",
      relationTo: "media",
    },
    ...slugField(),
  ],
}
