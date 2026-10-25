import {
  protectPageDeletion,
  protectPageTrash,
} from "@/hooks/collections/pages/protect-dependencies"
import { validatePageParent } from "@/hooks/collections/pages/validate-parent"
import { slugField } from "@/fields/slug"
import { seoFields } from "@/fields/seo"
import { websitePreview } from "@/website/preview"
import { beforeUniversalChange } from "@/hooks/collections/universal/before-change"
import { afterUniversalChange } from "@/hooks/collections/universal/after-change"
import { afterUniversalDelete } from "@/hooks/collections/universal/after-delete"
import { lockSlugAfterPublish } from "@/hooks/utilities/lock-slug"
import type { CollectionConfig } from "payload"

import { sections } from "@/components/sections/config"
import { authenticated } from "@/access/authenticated"
import { authenticatedOrPublished } from "@/access/authenticatedOrPublished"
import { populatePublishedAt } from "@/hooks/populate-published-at"
import { applyDefaultTemplate } from "@/hooks/collections/pages/apply-default-template"
import { CollectionCustomMetadata } from "@/types/icon-types"

const pageConfig: CollectionConfig = {
  slug: "pages",
  custom: {
    smartsite: {
      route: true,
      label: "Pages",
      seo: true,
      search: true,
      mcp: true,
      sitemap: {
        enabled: true,
        priority: 0.7,
        changefreq: "weekly",
        respectNoIndex: true,
      },
    },
  },
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
    ...websitePreview("pages"),
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

        { name: "seo", label: "SEO", fields: seoFields({ seoSchemaType: "WebPage" }) },
      ],
    },
    {
      name: "templateControl",
      type: "ui",
      label: "Apply Template",
      admin: {
        position: "sidebar",
        components: {
          Field: "@/admin/components/assign-template",
        },
      },
    },
    ...slugField("title"),
  ],
  hooks: {
    beforeValidate: [validatePageParent],
    beforeDelete: [protectPageDeletion],
    beforeOperation: [lockSlugAfterPublish],
    afterDelete: [afterUniversalDelete],
    beforeChange: [
      protectPageTrash,
      populatePublishedAt,
      applyDefaultTemplate,
      beforeUniversalChange,
    ],
    afterChange: [afterUniversalChange],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 100, // We set this interval for optimal live preview
      },
      schedulePublish: false, // Opt in here after configuring a scheduled jobs runner.
    },
    maxPerDoc: 50,
  },
}

export const Pages: CollectionConfig = pageConfig
