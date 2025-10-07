import { getSmartSiteConfig } from "@/admin/config"
import { resolveConfiguration } from "@/admin/config/resolver"
import admin from "@/admin/payload/admin"
import db, { databaseInfo } from "@/admin/payload/db/config"
import { mediaInfo } from "@/admin/payload/collections/media"
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

function maskDatabaseUrl(raw: string): string {
  try {
    const u = new URL(raw)
    const host = u.host
    const protocol = u.protocol.replace(":", "")
    const dbPath = u.pathname && u.pathname !== "/" ? u.pathname.slice(1) : ""
    return `${protocol}://${host}${dbPath ? "/" + dbPath : ""}`
  } catch {
    return "unparseable-url"
  }
}

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
  onInit: async payload => {
    if (process.env.NODE_ENV !== "production") {
      const banner = [
        "\n=== SMART-SITE DB ===",
        `Target: ${databaseInfo.target.toUpperCase()} | Provider: ${databaseInfo.provider}`,
        `URL: ${maskDatabaseUrl(databaseInfo.url)}`,
        "====================\n",
      ].join("\n")
      payload.logger.info(banner)

      const mediaLocation = mediaInfo.provider === "local" && mediaInfo.dir
        ? path.relative(process.cwd(), mediaInfo.dir)
        : "vercel-blob"

      const mediaBanner = [
        "\n=== MEDIA STORAGE ===",
        `Provider: ${mediaInfo.provider}`,
        `Location: ${mediaLocation}`,
        "====================\n",
      ].join("\n")
      payload.logger.info(mediaBanner)
    }
  },
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
})

export default config
