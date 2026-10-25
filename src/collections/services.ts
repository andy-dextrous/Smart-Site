import { slugField } from "@/fields/slug"
import { seoFields } from "@/fields/seo"
import { websitePreview } from "@/website/preview"
import { beforeUniversalChange } from "@/hooks/collections/universal/before-change"
import { afterUniversalChange } from "@/hooks/collections/universal/after-change"
import { afterUniversalDelete } from "@/hooks/collections/universal/after-delete"
import { lockSlugAfterPublish } from "@/hooks/utilities/lock-slug"
import type { CollectionConfig, Field, Where } from "payload"

import { sections } from "@/components/sections/config"
import { authenticated } from "@/access/authenticated"
import { authenticatedOrPublished } from "@/access/authenticatedOrPublished"
import { createApplyDefaultTemplateHook } from "@/hooks/collections/pages/apply-default-template"
import { populatePublishedAt } from "@/hooks/populate-published-at"
import { CollectionCustomMetadata } from "@/types/icon-types"

const applyDefaultTemplate = createApplyDefaultTemplateHook("services")

function shouldShowParentField(
  _data: unknown,
  siblingData?: { isTopLevel?: boolean | null }
): boolean {
  return siblingData?.isTopLevel === false
}

function buildParentFilter({ id }: { id?: string | number | null }): Where {
  const query: Where = {
    isTopLevel: {
      equals: true,
    },
  }

  if (typeof id !== "undefined" && id !== null) {
    query.id = {
      not_equals: id,
    }
  }

  return query
}

function validateParentSelection(
  value: unknown,
  {
    siblingData,
  }: {
    siblingData?: { isTopLevel?: boolean | null }
  }
): true | string {
  if (siblingData?.isTopLevel === false && !value) {
    return "Select a parent service."
  }

  return true
}

const serviceHierarchyFields: Field[] = [
  {
    name: "isTopLevel",
    type: "checkbox",
    label: "Top-level service",
    defaultValue: true,
    admin: {
      position: "sidebar",
      description: "Uncheck to nest this service under a parent.",
    },
  },
  {
    name: "parentService",
    type: "relationship",
    relationTo: "services",
    hasMany: false,
    admin: {
      position: "sidebar",
      condition: shouldShowParentField,
    },
    filterOptions: buildParentFilter,
    validate: validateParentSelection,
  },
]

const servicesConfig: CollectionConfig = {
  slug: "services",
  custom: {
    smartsite: {
      route: true,
      label: "Services",
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
    isTopLevel: true,
    parentService: true,
  },
  admin: {
    ...websitePreview("services"),
    defaultColumns: [
      "title",
      "featuredImage",
      "slug",
      "updatedAt",
      "id",
      "status",
      "isTopLevel",
      "parentService",
    ],
    description:
      "Services represent the core business offerings of the company that should have a page dedicated to them for converting specific leads and customers. They are a great addition for SEO and marketing.",
    hideAPIURL: process.env.NODE_ENV === "production",
    useAsTitle: "title",
    custom: {
      icon: {
        type: "react-icons",
        name: "md/MdBusinessCenter",
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
    ...serviceHierarchyFields,
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
              blocks: sections.sectionBlocks,
              required: true,
              admin: {
                initCollapsed: false,
              },
            },
          ],
        },

        { name: "seo", label: "SEO", fields: seoFields({ seoSchemaType: "Service" }) },
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
    beforeOperation: [lockSlugAfterPublish],
    afterDelete: [afterUniversalDelete],
    afterChange: [afterUniversalChange],
    beforeChange: [populatePublishedAt, applyDefaultTemplate, beforeUniversalChange],
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

export const Services: CollectionConfig = servicesConfig
