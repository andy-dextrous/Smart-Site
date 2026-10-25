import type { CollectionConfig } from "payload"

import { sections } from "@/components/sections/config"
import { authenticated } from "@/payload/access/authenticated"
import { authenticatedOrPublished } from "@/payload/access/authenticatedOrPublished"
import { afterTemplateChange } from "@/payload/hooks/collections/templates/after-change"
import { afterUniversalDelete } from "@/payload/hooks/collections/universal/after-delete"
import { CollectionCustomMetadata } from "@/types/icon-types"

export const Templates: CollectionConfig = {
  slug: "templates",
  custom: { smartsite: { mcp: true } },
  access: {
    create: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "description", "updatedAt"],
    custom: {
      icon: {
        type: "react-icons",
        name: "hi/HiTemplate",
      },
    } as CollectionCustomMetadata,
  },
  hooks: {
    afterChange: [afterTemplateChange],
    afterDelete: [afterUniversalDelete],
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      admin: {
        description: "Template name (e.g. 'Service Page', 'Product Landing')",
      },
    },
    {
      name: "description",
      type: "textarea",
      admin: {
        description: "What this template is used for",
      },
    },

    {
      name: "sections",
      label: "Template Sections",
      type: "blocks",
      blocks: sections.sectionBlocks,
      required: true,
      admin: {
        description: "Pre-configured sections with default content",
      },
    },
  ],
}
