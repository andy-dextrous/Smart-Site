import type { CollectionConfig } from "payload"

import { anyone } from "@/payload/access/anyone"
import { authenticated } from "@/payload/access/authenticated"

export const Categories: CollectionConfig = {
  slug: "categories",
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    useAsTitle: "title",
    hideAPIURL: process.env.NODE_ENV === "production",
  },
  fields: [
    {
      name: "title",
      label: "Category Name",
      type: "text",
      required: true,
    },
    {
      name: "description",
      label: "Category Description",
      type: "textarea",
    },
  ],
}
