import type { CollectionConfig } from "payload"

import { anyone } from "@/payload/access/anyone"
import { authenticated } from "@/payload/access/authenticated"
import { slugField } from "@/payload/fields/slug"

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
      type: "text",
      required: true,
    },
    {
      name: "description",
      type: "textarea",
      label: "Description",
      required: true,
    },
    {
      name: "posts",
      type: "join",
      collection: "posts",
      defaultLimit: 0,
      label: "Posts",
      maxDepth: 2,
      on: "category",
    },
    ...slugField(),
  ],
}
