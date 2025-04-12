import type { CollectionConfig } from "payload"

import { anyone } from "@/payload/access/anyone"
import { authenticated } from "@/payload/access/authenticated"
import { slugField } from "@/payload/fields/slug"

export const Menus: CollectionConfig = {
  slug: "menus",
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    useAsTitle: "title",
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
  ],
}
