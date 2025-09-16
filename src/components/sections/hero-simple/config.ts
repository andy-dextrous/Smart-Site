import type { Block } from "payload"
import { defaultLexical } from "@/components/fields/rich-text/default-lexical"

/*************************************************************************/
/*  HERO SIMPLE - MINIMAL
/*************************************************************************/

export const HeroSimple: Block = {
  slug: "hero-simple",
  interfaceName: "HeroSimpleBlock",
  admin: {
    group: "Page Headers",
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
      editor: defaultLexical,
      label: false,
    },
    {
      name: "align",
      type: "select",
      options: ["left", "center"],
      defaultValue: "center",
      required: true,
    },
  ],
}

