import { formBuilderPlugin } from "@payloadcms/plugin-form-builder"
import { nestedDocsPlugin } from "@payloadcms/plugin-nested-docs"
import { redirectsPlugin } from "@payloadcms/plugin-redirects"
import { searchPlugin } from "@payloadcms/plugin-search"
import {
  FixedToolbarFeature,
  HeadingFeature,
  lexicalEditor,
} from "@payloadcms/richtext-lexical"
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob"
import { revalidateTag } from "next/cache"
import { Plugin } from "payload"
import { markAsReadAfterRead } from "@/admin/payload/hooks/form-submissions"
import { beforeSyncWithSearch } from "@/admin/payload/search/beforeSync"
import { searchFields } from "@/admin/payload/search/fieldOverrides"

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
        ({ doc, req: { payload } }) => {
          payload.logger.info(`Revalidating redirects`)

          revalidateTag("redirects")

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
  },
})

/*************************************************************************/
/*  SEARCH PLUGIN
/*************************************************************************/

const search = searchPlugin({
  collections: ["pages", "posts"],
  defaultPriorities: {
    pages: 10,
    posts: 20,
  },
  beforeSync: beforeSyncWithSearch,
  searchOverrides: {
    fields: ({ defaultFields }) => {
      return [...defaultFields, ...searchFields]
    },
  },
})

/*************************************************************************/
/*  BLOB STORAGE PLUGIN
/*************************************************************************/

const blob = vercelBlobStorage({
  cacheControlMaxAge: 60 * 60 * 24 * 365, // 1 year
  collections: {
    media: true,
  },
  token: process.env.BLOB_READ_WRITE_TOKEN,
})

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

export const plugins: Plugin[] = [redirects, forms, search, /*blob,*/ nestedDocs]
