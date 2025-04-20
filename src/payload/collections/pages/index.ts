import type { CollectionConfig } from "payload"

import { sectionBlocks } from "@/components/sections/config"
import { authenticated } from "@/payload/access/authenticated"
import { authenticatedOrPublished } from "@/payload/access/authenticatedOrPublished"
import { slugField } from "@/payload/fields/slug"
import { populatePublishedAt } from "@/payload/hooks/populatePublishedAt"
import { generatePreviewPath } from "@/utilities/generatePreviewPath"
import { revalidateDelete, revalidatePage } from "./hooks/revalidatePage"

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from "@payloadcms/plugin-seo/fields"
import { lockSlugAfterPublish } from "./hooks/lockSlug"
// import { assignTemplate } from "./hooks/assignTemplate"

export const Pages: CollectionConfig<"pages"> = {
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
    livePreview: {
      url: ({ data, req }) => {
        const path = generatePreviewPath({
          slug: typeof data?.slug === "string" ? data.slug : "",
          collection: "pages",
          req,
        })

        return path
      },
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: typeof data?.slug === "string" ? data.slug : "",
        collection: "pages",
        req,
      }),
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
      name: "categories",
      type: "relationship",
      admin: {
        position: "sidebar",
      },
      hasMany: true,
      relationTo: "categories",
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
        {
          name: "meta",
          label: "SEO Metadata",
          fields: [
            OverviewField({
              titlePath: "meta.title",
              descriptionPath: "meta.description",
              imagePath: "meta.image",
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: "media",
            }),
            MetaDescriptionField({}),
            PreviewField({
              hasGenerateFn: true,
              titlePath: "meta.title",
              descriptionPath: "meta.description",
            }),
            {
              name: "noIndex",
              label: "No Index Page",
              type: "checkbox",
              defaultValue: false,
            },
            {
              name: "canonicalUrl",
              label: "Canonical URL",
              type: "text",
            },
          ],
        },
      ],
    },

    ...slugField(),
  ],
  hooks: {
    afterChange: [revalidatePage],
    beforeChange: [populatePublishedAt],
    afterDelete: [revalidateDelete],
    beforeOperation: [lockSlugAfterPublish],
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
