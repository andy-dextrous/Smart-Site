import admin from "@/admin/payload/admin"
import { blocks } from "@/admin/payload/blocks/config"
import collections from "@/admin/payload/collections"
import db from "@/admin/payload/db/config"
import { email } from "@/admin/payload/email/config"
import globals from "@/admin/payload/globals"
import jobs from "@/admin/payload/jobs/config"
import { plugins } from "@/admin/payload/plugins"
import { syncFrontendCollectionsOnInit } from "@/admin/payload/collections/frontend"
import { getServerSideURL } from "@/admin/utilities/get-url"
import { lexicalEditor } from "@payloadcms/richtext-lexical"
import path from "path"
import { buildConfig } from "payload"
import sharp from "sharp"
import { fileURLToPath } from "url"
import smartSiteConfig from "@/smartsite.config"
import { mergePayloadConfig } from "@/admin/utilities/merge-payload-config"

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Base Payload config with admin defaults
const baseConfig = {
  admin,
  blocks,
  collections,
  cors: [getServerSideURL()].filter(Boolean),
  db,
  editor: lexicalEditor(),
  email,
  globals,
  plugins,
  jobs,
  secret: process.env.PAYLOAD_SECRET || "",
  serverURL: getServerSideURL(),
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  onInit: async () => {
    syncFrontendCollectionsOnInit()
  },
}

// Intelligently merge client config with base config
const mergedConfig = mergePayloadConfig(baseConfig, smartSiteConfig.payload)

export default buildConfig(mergedConfig)
