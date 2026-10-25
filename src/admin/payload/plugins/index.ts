import { refreshAfterCommit } from "@/admin/payload/hooks/utilities/after-commit"
import { smartsiteMcp } from "@/admin/mcp/plugin"
import { formBuilderPlugin } from "@payloadcms/plugin-form-builder"
import { nestedDocsPlugin } from "@payloadcms/plugin-nested-docs"
import { redirectsPlugin } from "@payloadcms/plugin-redirects"
import { searchPlugin } from "@payloadcms/plugin-search"
import {
  FixedToolbarFeature,
  HeadingFeature,
  lexicalEditor,
} from "@payloadcms/richtext-lexical"
import { revalidateTag } from "next/cache"
import { Plugin } from "payload"
import { markAsReadAfterRead } from "@/admin/payload/hooks/form-submissions"
import { beforeSyncWithSearch } from "@/admin/payload/search/beforeSync"
import { searchFields } from "@/admin/payload/search/fieldOverrides"
import { getSmartSiteConfig } from "@/admin/config"
import { getFrontendCollections } from "@/admin/config/frontend"
import { getSearchConfig } from "@/admin/config/features"
import { resolveStoragePlugins } from "@/admin/config/storage-resolver"
import { revalidateCollection } from "@/admin/cache"

/*************************************************************************/
/*  REDIRECTS PLUGIN
/*************************************************************************/

const redirects = redirectsPlugin({
  collections: ["pages", "posts"],
  overrides: {
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
          await refreshAfterCommit(req, async () => {
            if (previousDoc?.from && previousDoc.from !== doc.from) {
              revalidateTag(`redirect:${previousDoc.from}`, { expire: 0 })
            }

            revalidateTag(`redirect:${doc.from}`, { expire: 0 })
            revalidateTag("collection:redirects", { expire: 0 })
          })
          return doc
        },
      ],
      afterDelete: [
        async ({ doc, req }) => {
          await refreshAfterCommit(req, async () => {
            if (doc?.from) {
              revalidateTag(`redirect:${doc.from}`, { expire: 0 })
            }

            revalidateTag("collection:redirects", { expire: 0 })
          })
          return doc
        },
      ],
    },
  },
})

/*************************************************************************/
/*  FORM BUILDER PLUGIN
/*************************************************************************/

const forms = formBuilderPlugin({
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

const frontendCollections = getFrontendCollections()
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
              await refreshAfterCommit(req, () =>
                revalidateCollection("search", "search-index-change")
              )
              return doc
            },
          ],
          afterDelete: [
            async ({ req }) => {
              await refreshAfterCommit(req, () =>
                revalidateCollection("search", "search-index-delete")
              )
            },
          ],
        },
      },
    })
  : null

/*************************************************************************/
/*  NESTED DOCS PLUGIN
/*************************************************************************/

const nestedDocs = nestedDocsPlugin({
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

const smartSiteConfig = getSmartSiteConfig()
const searchConfig = getSearchConfig()
const searchEnabled = searchConfig.enabled

export const plugins: Plugin[] = [
  redirects,
  forms,
  ...(searchEnabled && searchPluginInstance ? [searchPluginInstance] : []),
  nestedDocs,
  smartsiteMcp,
]

/*************************************************************************/
/*  PLUGIN RESOLVER
/*************************************************************************/

export function getPlugins(): Plugin[] {
  const storagePlugins = resolveStoragePlugins(smartSiteConfig)

  return [
    redirects,
    forms,
    ...(searchEnabled && searchPluginInstance ? [searchPluginInstance] : []),
    ...storagePlugins,
    nestedDocs,
    smartsiteMcp,
  ]
}
