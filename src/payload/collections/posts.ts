import { slugField } from "@/payload/fields/slug"
import { seoFields } from "@/payload/fields/seo"
import { websitePreview } from "@/lib/preview"
import { beforeUniversalChange } from "@/payload/hooks/collections/universal/before-change"
import { afterUniversalChange } from "@/payload/hooks/collections/universal/after-change"
import { afterUniversalDelete } from "@/payload/hooks/collections/universal/after-delete"
import { lockSlugAfterPublish } from "@/payload/hooks/utilities/lock-slug"
import type { CollectionConfig } from "payload"

import {
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from "@payloadcms/richtext-lexical"

import { authenticated } from "@/payload/access/authenticated"
import { populateAuthors } from "@/payload/hooks/collections/posts/populate-authors"
import { anyone } from "@/payload/access/anyone"
import { CollectionCustomMetadata } from "@/types/icon-types"

const postsConfig: CollectionConfig = {
  slug: "posts",
  custom: {
    smartsite: {
      route: true,
      label: "Posts",
      seo: true,
      search: true,
      mcp: true,
      sitemap: {
        enabled: true,
        priority: 0.6,
        changefreq: "daily",
        respectNoIndex: true,
      },
    },
  },
  enableQueryPresets: true,
  trash: true,
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  defaultPopulate: {
    title: true,
    slug: true,
    uri: true,
    categories: true,
  },
  admin: {
    ...websitePreview("posts"),
    defaultColumns: [
      "title",
      "featuredImage",
      "slug",
      "updatedAt",
      "categories",
      "status",
    ],
    hideAPIURL: process.env.NODE_ENV === "production",
    useAsTitle: "title",
    custom: {
      icon: {
        type: "react-icons",
        name: "fa/FaRss",
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
      name: "relatedPosts",
      type: "relationship",
      admin: {
        position: "sidebar",
      },
      filterOptions: ({ id, data }) => {
        const query: any = {
          id: {
            not_in: [id],
          },
        }

        // If the current post has categories, prioritize posts with matching categories
        if (
          data?.categories &&
          Array.isArray(data.categories) &&
          data.categories.length > 0
        ) {
          const categoryIds = data.categories.map((cat: any) =>
            typeof cat === "object" ? cat.id : cat
          )

          query.or = [
            // First priority: posts with matching categories
            {
              categories: {
                in: categoryIds,
              },
            },
            // Second priority: all other posts (as fallback)
            {
              categories: {
                not_in: categoryIds,
              },
            },
          ]
        }

        return query
      },
      hasMany: true,
      maxDepth: 2,
      relationTo: "posts",
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
      name: "featuredImage",
      label: "Featured Image",
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
          fields: [
            {
              name: "content",
              type: "richText",
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    HeadingFeature({ enabledHeadingSizes: ["h1", "h2", "h3", "h4"] }),
                    FixedToolbarFeature(),
                    InlineToolbarFeature(),
                    HorizontalRuleFeature(),
                  ]
                },
              }),
              label: false,
            },
          ],
          label: "Content",
        },

        { name: "seo", label: "SEO", fields: seoFields({ seoSchemaType: "Article" }) },
      ],
    },
    {
      name: "publishedAt",
      type: "date",
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
        },
        position: "sidebar",
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData._status === "published" && !value) {
              return new Date()
            }
            return value
          },
        ],
      },
    },
    {
      name: "authors",
      type: "relationship",
      admin: {
        position: "sidebar",
      },
      hasMany: true,
      relationTo: "users",
    },
    // This field is only used to populate the user data via the `populateAuthors` hook
    // This is because the `user` collection has access control locked to protect user privacy
    // GraphQL will also not return mutated user data that differs from the underlying schema
    {
      name: "populatedAuthors",
      type: "array",
      access: {
        update: () => false,
      },
      admin: {
        disabled: true,
        readOnly: true,
      },
      fields: [
        {
          name: "id",
          type: "text",
        },
        {
          name: "name",
          type: "text",
        },
      ],
    },
    ...slugField("title"),
  ],
  hooks: {
    beforeOperation: [lockSlugAfterPublish],
    beforeChange: [beforeUniversalChange],
    afterChange: [afterUniversalChange],
    afterDelete: [afterUniversalDelete],
    afterRead: [populateAuthors],
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

export const Posts: CollectionConfig = postsConfig
