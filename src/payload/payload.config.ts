import admin from "@/payload/admin"
import collections from "@/payload/collections"
import db from "@/payload/db/config"
import globals from "@/payload/globals"
import jobs from "@/payload/jobs/config"
import { email } from "@/payload/email/config"
import { plugins } from "@/payload/plugins"
import { getServerSideURL } from "@/utilities/getURL"
import { lexicalEditor } from "@payloadcms/richtext-lexical"
import path from "path"
import { buildConfig } from "payload"
import sharp from "sharp"
import { fileURLToPath } from "url"
import { blocks } from "@/payload/blocks/config"

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
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
})
