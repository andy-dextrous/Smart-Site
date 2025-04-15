import { revalidateRedirects } from "@/payload/hooks/revalidateRedirects"
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob"
import { formBuilderPlugin } from "@payloadcms/plugin-form-builder"
import { nestedDocsPlugin } from "@payloadcms/plugin-nested-docs"
import { redirectsPlugin } from "@payloadcms/plugin-redirects"
import { searchPlugin } from "@payloadcms/plugin-search"
import { seoPlugin } from "@payloadcms/plugin-seo"
import { GenerateTitle, GenerateURL } from "@payloadcms/plugin-seo/types"
import {
  FixedToolbarFeature,
  HeadingFeature,
  lexicalEditor,
} from "@payloadcms/richtext-lexical"
import { Plugin } from "payload"

import { Page, Post } from "@/payload/payload-types"
import { beforeSyncWithSearch } from "@/payload/search/beforeSync"
import { searchFields } from "@/payload/search/fieldOverrides"
import { getServerSideURL } from "@/utilities/getURL"

const generateTitle: GenerateTitle<Post | Page> = ({ doc }) => {
  return doc?.title ? `${doc.title}` : "WILD Child Website Template"
}

const generateURL: GenerateURL<Post | Page> = ({ doc }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

export const plugins: Plugin[] = [
  redirectsPlugin({
    collections: ["pages", "posts"],
    overrides: {
      // @ts-expect-error - This is a valid override, mapped fields don't resolve to the same type
      fields: ({ defaultFields }) => {
        return defaultFields.map(field => {
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
        })
      },
      hooks: {
        afterChange: [revalidateRedirects],
      },
    },
  }),

  seoPlugin({
    generateTitle,
    generateURL,
    generateImage: ({ doc }) => doc?.meta?.image || doc?.featuredImage,
  }),
  formBuilderPlugin({
    fields: {
      payment: false,
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
  }),
  searchPlugin({
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
  }),
  vercelBlobStorage({
    cacheControlMaxAge: 60 * 60 * 24 * 365, // 1 year
    collections: {
      media: true,
    },
    token: process.env.BLOB_READ_WRITE_TOKEN,
  }),
  nestedDocsPlugin({
    collections: ["pages", "categories"],
    generateLabel: (_, doc) => doc.title as string,
    generateURL: docs => docs.reduce((url, doc) => `${url}/${doc.slug as string}`, ""),
  }),
]
