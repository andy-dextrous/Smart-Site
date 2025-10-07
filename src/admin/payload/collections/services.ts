import type { CollectionConfig, Field, Where } from "payload"

import { sections } from "@/components/sections/config"
import { authenticated } from "@/admin/payload/access/authenticated"
import { authenticatedOrPublished } from "@/admin/payload/access/authenticatedOrPublished"
import { createApplyDefaultTemplateHook } from "@/admin/payload/hooks/collections/pages/apply-default-template"
import { populatePublishedAt } from "@/admin/payload/hooks/populate-published-at"
// Frontend wrapper is now applied dynamically via resolver
import { CollectionCustomMetadata } from "@/admin/payload/types/icon-types"

const applyDefaultTemplate = createApplyDefaultTemplateHook("services")

function shouldShowParentField(
  _data: unknown,
  siblingData?: { isTopLevel?: boolean | null }
): boolean {
  return siblingData?.isTopLevel === false
}

function buildParentFilter({
  id,
}: {
  id?: string | number | null
}): Where {
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
}

// Frontend wrapper is now applied dynamically via resolver based on config
export const Services: CollectionConfig = servicesConfig
