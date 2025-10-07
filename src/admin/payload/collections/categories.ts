import type { CollectionConfig } from "payload"

import { anyone } from "@/admin/payload/access/anyone"
import { authenticated } from "@/admin/payload/access/authenticated"
import { CollectionCustomMetadata } from "@/admin/payload/types/icon-types"

export const Categories: CollectionConfig = {
  slug: "categories",
  enableQueryPresets: true,
  trash: true,
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    useAsTitle: "title",
    hideAPIURL: process.env.NODE_ENV === "production",
    custom: {
      icon: {
        type: "lucide",
        name: "List"
      }
    } as CollectionCustomMetadata,
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
