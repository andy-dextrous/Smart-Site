import type { Block } from "payload"
import { defaultLexical } from "@/payload/fields/default-lexical"

export const SimpleText: Block = {
  slug: "simple-text",
  imageURL: "/api/media/file/simple text-600x456.png",
  interfaceName: "SimpleTextBlock",
  admin: {
    group: "Content & Media",
  },
  fields: [
    {
      name: "content",
      type: "richText",
      editor: defaultLexical,
      label: "Content",
      required: true,
    },
  ],
}
