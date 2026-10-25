import type { WebsiteCollection } from "@/website/collection-metadata"
import { refreshRelatedContent, refreshDeletedContent } from "@/website/publication/hooks"
import { queuePublication } from "@/website/publication/intent"
import { refreshAfterCommit } from "@/hooks/utilities/after-commit"
import { formBuilderPlugin } from "@payloadcms/plugin-form-builder"
import { nestedWebsite } from "@/plugins/nested-website"
import { redirectsPlugin } from "@payloadcms/plugin-redirects"
import { searchPlugin } from "@payloadcms/plugin-search"
import {
  FixedToolbarFeature,
  HeadingFeature,
  lexicalEditor,
} from "@payloadcms/richtext-lexical"
import { revalidateTag } from "next/cache"
import { Plugin, Config } from "payload"
import { markAsReadAfterRead } from "@/hooks/form-submissions"
import { beforeSyncWithSearch } from "@/website/search/beforeSync"
import { searchFields } from "@/website/search/fieldOverrides"
import { revalidateCollection } from "@/website/cache"

/*************************************************************************/
/*  REDIRECTS PLUGIN
/*************************************************************************/

export const websiteRedirects = redirectsPlugin({
  collections: ["pages", "posts"],
  overrides: {
    custom: { smartsite: { mcp: true } },
    // @ts-expect-error - This is a valid override, mapped fields don't resolve to the same type
    fields: ({ defaultFields }) => {
      return [
        ...defaultFields.map(field => {
          if ("name" in field && field.name === "from") {
            return {
              ...field,
              admin: {
                description:
                  "You will need to rebuild the website when changing this field.",
              },
            }
          }
          return field
        }),
        {
          name: "type",
          type: "select",
          required: true,
          defaultValue: "manual",
          options: [
            {
              label: "Manual",
              value: "manual",
            },
            {
              label: "Automatic",
              value: "automatic",
            },
          ],
          admin: {
            description: "How this redirect was created",
            position: "sidebar",
          },
        },
        {
          name: "source",
          type: "select",
          required: true,
          defaultValue: "admin",
          options: [
            {
              label: "Admin",
              value: "admin",
            },
            {
              label: "URI Index",
              value: "uri-index",
            },
          ],
          admin: {
            description: "Source system that created this redirect",
            position: "sidebar",
          },
        },
      ]
    },
    hooks: {
      afterChange: [
        async ({ doc, previousDoc, req }) => {
          await queuePublication(req, "refresh", `redirects/${doc.id}`)
          return doc
        },
      ],
      afterDelete: [
        async ({ doc, req }) => {
          await queuePublication(req, "refresh", `redirects/${doc.id}`)
          return doc
        },
      ],
    },
  },
})

/*************************************************************************/
/*  FORM BUILDER PLUGIN
/*************************************************************************/

export const websiteForms = formBuilderPlugin({
  fields: {
    payment: false,
    phone: {
      slug: "phone",
      labels: {
        singular: "Phone Number",
        plural: "Phone Numbers",
      },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "name",
              type: "text",
              label: "Name (lowercase, no special characters)",
              required: true,
              admin: {
                width: "50%",
              },
            },
            {
              name: "label",
              type: "text",
              label: "Label",
              admin: {
                width: "50%",
              },
            },
          ],
        },
        {
          type: "row",
          fields: [
            {
              name: "width",
              type: "number",
              label: "Field Width (percentage)",
              admin: {
                width: "50%",
              },
            },
            {
              name: "defaultValue",
              type: "text",
              label: "Default Value",
              admin: {
                width: "50%",
              },
            },
          ],
        },
        {
          name: "required",
          type: "checkbox",
          label: "Required",
        },
      ],
    } as any,
  },
  formOverrides: {
    custom: { smartsite: { mcp: true } },
    hooks: { afterChange: [refreshRelatedContent], afterDelete: [refreshDeletedContent] },
    fields: ({ defaultFields }) => {
      return defaultFields.map(field => {
        if ("name" in field && field.name === "confirmationMessage") {
          return {
            ...field,
            editor: lexicalEditor({
              features: ({ rootFeatures }) => {
                return [
                  ...rootFeatures,
                  FixedToolbarFeature(),
                  HeadingFeature({ enabledHeadingSizes: ["h1", "h2", "h3", "h4"] }),
                ]
              },
            }),
          }
        }
        return field
      })
    },
  },
  formSubmissionOverrides: {
    fields: ({ defaultFields }) => {
      return [
        ...defaultFields,
        {
          name: "isRead",
          type: "checkbox",
          label: "Read Status",
          defaultValue: false,
          admin: {
            hidden: true,
          },
        },
      ]
    },
    hooks: {
      afterRead: [markAsReadAfterRead],
    },
    access: {
      update: ({ req }) => {
        return Boolean(req.user)
      },
    },
  },
})

/*************************************************************************/
/*  SEARCH PLUGIN
/*************************************************************************/

export function websiteSearch(frontendCollections: WebsiteCollection[]): Plugin {
  const searchCollections = frontendCollections
    .filter(
      collection => (collection.searchEnabled ?? true) && collection.slug !== "uri-index"
    )
    .map(collection => collection.slug)
    .sort((a, b) => {
      if (a === "pages") return -1
      if (b === "pages") return 1
      return a.localeCompare(b)
    })

  const defaultPriorities = searchCollections.reduce<Record<string, number>>(
    (acc, slug, index) => {
      acc[slug] = (index + 1) * 10
      return acc
    },
    {}
  )

  const searchPluginInstance = searchCollections.length
    ? searchPlugin({
        collections: searchCollections,
        defaultPriorities,
        beforeSync: beforeSyncWithSearch,
        searchOverrides: {
          fields: ({ defaultFields }) => {
            return [...defaultFields, ...searchFields]
          },
          hooks: {
            afterChange: [
              async ({ doc, req }) => {
                await queuePublication(req, "refresh", "search/update")
                return doc
              },
            ],
            afterDelete: [
              async ({ req }) => {
                await queuePublication(req, "refresh", "search/delete")
              },
            ],
          },
        },
      })
    : (config: Config) => config
  return searchPluginInstance
}

/*************************************************************************/
/*  NESTED DOCS PLUGIN
/*************************************************************************/

export const websiteNestedDocs = nestedWebsite({
  collections: ["pages", "categories"],
  generateLabel: (_, doc) => doc.title as string,
  generateURL: docs => {
    const finalDoc = docs[docs.length - 1]
    if ((finalDoc as any)?.uri) {
      return (finalDoc as any).uri
    }

    return docs.reduce((url, doc) => `${url}/${doc.slug as string}`, "")
  },
})

/*************************************************************************/
/*  PLUGINS
/*************************************************************************/
