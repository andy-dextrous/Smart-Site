import { getSmartSiteConfig } from "@/admin/config"
import { resolveConfiguration } from "@/admin/config/resolver"
import admin from "@/admin/payload/admin"
import db from "@/admin/payload/db/config"
import { email } from "@/admin/payload/email/config"
import jobs from "@/admin/payload/jobs/config"
import { getServerSideURL } from "@/admin/utilities/get-url"
import { lexicalEditor } from "@payloadcms/richtext-lexical"
import path from "path"
import { buildConfig } from "payload"
import sharp from "sharp"
import { fileURLToPath } from "url"

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const resolved = resolveConfiguration(getSmartSiteConfig())

const config = buildConfig({
  admin,
  blocks: resolved.blocks,
  collections: resolved.collections,
  cors: [getServerSideURL()].filter(Boolean),
  db,
  editor: lexicalEditor(),
  email,
  folders: {
    browseByFolder: true,
    slug: "payload-folders",
    fieldName: "folder",
  },
  globals: resolved.globals,
  plugins: resolved.plugins,
  jobs,
  secret: process.env.PAYLOAD_SECRET || "",
  serverURL: getServerSideURL(),
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
})

export default config
