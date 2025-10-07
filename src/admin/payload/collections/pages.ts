import type { CollectionConfig } from "payload"

import { sections } from "@/components/sections/config"
import { authenticated } from "@/admin/payload/access/authenticated"
import { authenticatedOrPublished } from "@/admin/payload/access/authenticatedOrPublished"
import { populatePublishedAt } from "@/admin/payload/hooks/populate-published-at"
import { applyDefaultTemplate } from "@/admin/payload/hooks/collections/pages/apply-default-template"
import { beforePageChange } from "@/admin/payload/hooks/collections/pages/before-change"
import { afterPageChange } from "@/admin/payload/hooks/collections/pages/after-change"
// Frontend wrapper is now applied dynamically via resolver
import { CollectionCustomMetadata } from "@/admin/payload/types/icon-types"

const pageConfig: CollectionConfig = {
  slug: "pages",
  enableQueryPresets: true,
  trash: true,
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  defaultPopulate: {
    title: true,
    slug: true,
    uri: true,
    breadcrumbs: true,
  },
  admin: {
    defaultColumns: [
      "title",
      "featuredImage",
      "slug",
      "updatedAt",
      "id",
      "categories",
      "status",
    ],
    hideAPIURL: process.env.NODE_ENV === "production",
    useAsTitle: "title",
    custom: {
      icon: {
        type: "react-icons",
        name: "io/IoIosDocument",
      },
    } as CollectionCustomMetadata,
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "publishedAt",
      type: "date",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "featuredImage",
      type: "upload",
      relationTo: "media",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "categories",
      type: "relationship",
      relationTo: "categories",
      hasMany: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      type: "tabs",
      tabs: [
        {
          label: "Page Layout",
          fields: [
            {
              name: "sections",
              label: "Sections",
              type: "blocks",
              blocks: sections.sectionBlocks,
              required: false,
              minRows: 0,
              admin: {
                initCollapsed: false,
              },
            },
          ],
        },
      ],
    },
    {
      name: "templateControl",
      type: "ui",
      label: "Apply Template",
      admin: {
        position: "sidebar",
        components: {
          Field: "@/admin/payload/components/backend/assign-template",
        },
      },
    },
  ],
  hooks: {
    beforeChange: [populatePublishedAt, applyDefaultTemplate, beforePageChange],
    afterChange: [afterPageChange],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 100, // We set this interval for optimal live preview
      },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}

// Frontend wrapper is now applied dynamically via resolver based on config
export const Pages: CollectionConfig = pageConfig
