import type { Block } from "payload"
import { defaultLexical } from "@/components/fields/rich-text/default-lexical"

/*************************************************************************/
/*  CONTENT - MINIMAL WYSIWYG
/*************************************************************************/

export const Content: Block = {
  slug: "content",
  interfaceName: "ContentBlock",
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

