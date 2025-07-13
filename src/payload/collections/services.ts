import type { CollectionConfig } from "payload"

import { sectionBlocks } from "@/components/sections/config"
import { authenticated } from "@/payload/access/authenticated"
import { authenticatedOrPublished } from "@/payload/access/authenticatedOrPublished"
import { createApplyDefaultTemplateHook } from "@/payload/hooks/collections/pages/apply-default-template"
import { populatePublishedAt } from "@/payload/hooks/populate-published-at"
import { enableFrontend } from "@/payload/collections/frontend"

const applyDefaultTemplate = createApplyDefaultTemplateHook("services")

export const Services: CollectionConfig<"services"> = enableFrontend(
  {
    slug: "services",
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
    },
    admin: {
      defaultColumns: ["title", "featuredImage", "slug", "updatedAt", "id", "status"],
      description:
        "Services represent the core business offerings of the company that should have a page dedicated to them for converting specific leads and customers. They are a great addition for SEO and marketing.",
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
        name: "description",
        type: "textarea",
        admin: {
          description: "Brief description of the service",
        },
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
        type: "tabs",
        tabs: [
          {
            label: "Service Content",
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
      beforeChange: [populatePublishedAt, applyDefaultTemplate],
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
  "Service Offerings",
  "Service"
)
