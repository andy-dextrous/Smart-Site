import { refreshRelatedContent, refreshDeletedContent } from "@/website/publication/hooks"
import type { CollectionConfig } from "payload"

import { anyone } from "@/access/anyone"
import { authenticated } from "@/access/authenticated"
import { CollectionCustomMetadata } from "@/types/icon-types"

export const Categories: CollectionConfig = {
  hooks: { afterChange: [refreshRelatedContent], afterDelete: [refreshDeletedContent] },
  slug: "categories",
  custom: { smartsite: { mcp: true } },
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
        name: "List",
      },
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
