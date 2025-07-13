import type { CollectionConfig } from "payload"

import { sectionBlocks } from "@/components/sections/config"
import { authenticated } from "@/payload/access/authenticated"
import { authenticatedOrPublished } from "@/payload/access/authenticatedOrPublished"
import { populatePublishedAt } from "@/payload/hooks/populate-published-at"
import { applyDefaultTemplate } from "@/payload/hooks/collections/pages/apply-default-template"
import { beforePageChange } from "@/payload/hooks/collections/pages/before-change"
import { afterPageChange } from "@/payload/hooks/collections/pages/after-change"
import { enableFrontend } from "@/payload/collections/frontend"

export const Pages: CollectionConfig<"pages"> = enableFrontend(
  {
    slug: "pages",
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
                blocks: sectionBlocks,
                required: true,
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
            Field: "@/payload/components/backend/assign-template",
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
  },
  "Pages",
  "WebPage"
)
