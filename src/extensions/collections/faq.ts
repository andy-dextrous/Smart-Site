import type { CollectionConfig } from "payload"
import { CollectionCustomMetadata } from "@/admin/payload/types/icon-types"

/*************************************************************************/
/*  FAQ COLLECTION
/*************************************************************************/

const FAQ: CollectionConfig = {
  slug: "faq",
  labels: {
    singular: "FAQ",
    plural: "FAQs",
  },
  admin: {
    useAsTitle: "question",
    defaultColumns: ["question", "category", "order"],
    custom: {
      icon: {
        type: "lucide",
        name: "CircleHelp"
      }
    } as CollectionCustomMetadata,
  },
  fields: [
    {
      name: "question",
      type: "text",
      required: true,
      label: "Question",
    },
    {
      name: "answer",
      type: "richText",
      required: true,
      label: "Answer",
    },
    {
      name: "category",
      type: "select",
      label: "Category",
      options: [
        { label: "General", value: "general" },
        { label: "Pricing", value: "pricing" },
        { label: "Technical", value: "technical" },
        { label: "Support", value: "support" },
      ],
      defaultValue: "general",
      required: true,
    },
    {
      name: "order",
      type: "number",
      label: "Display Order",
      defaultValue: 0,
      admin: {
        description: "Lower numbers appear first",
      },
    },
    {
      name: "featured",
      type: "checkbox",
      label: "Featured",
      defaultValue: false,
      admin: {
        description: "Show this FAQ prominently",
      },
    },
  ],
}

export default FAQ