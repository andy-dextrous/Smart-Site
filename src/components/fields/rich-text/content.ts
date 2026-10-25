import { FixedToolbarFeature, InlineToolbarFeature } from "@payloadcms/richtext-lexical"
import { lexicalEditor } from "@payloadcms/richtext-lexical"
import { richTextDefault } from "@/components/fields/rich-text/defaults"
import deepMerge from "@/utilities/deep-merge"
import type { Field } from "payload"

export const content = (overrides: Partial<Field> = {}): Field => {
  return deepMerge(
    {
      name: "content",
      type: "textarea",
      admin: {
        rows: 10,
      },
      required: true,
      defaultValue:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    },
    overrides
  )
}

export const richContent = (overrides: Partial<Field> = {}): Field => {
  return deepMerge(
    {
      name: "content",
      type: "richText",
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
      required: true,
      defaultValue: richTextDefault,
    },
    overrides
  )
}

export const heading = (overrides: Partial<Field> = {}): Field => {
  return deepMerge(
    {
      name: "heading",
      type: "text",
      required: true,
      admin: {
        placeholder: "Enter your heading here",
      },
      defaultValue: "Lorem Ipsum Dolor",
    },
    overrides
  )
}
