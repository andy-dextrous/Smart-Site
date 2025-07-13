import admin from "@/payload/admin"
import { blocks } from "@/payload/blocks/config"
import collections from "@/payload/collections"
import db from "@/payload/db/config"
import { email } from "@/payload/email/config"
import globals from "@/payload/globals"
import jobs from "@/payload/jobs/config"
import { plugins } from "@/payload/plugins"
import { syncFrontendCollectionsOnInit } from "@/payload/collections/frontend"
import { getServerSideURL } from "@/utilities/get-url"
import { lexicalEditor } from "@payloadcms/richtext-lexical"
import path from "path"
import { buildConfig } from "payload"
import sharp from "sharp"
import { fileURLToPath } from "url"

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
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
})
