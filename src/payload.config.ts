import { UpgradeReceipts } from "@/payload/upgrades/collection"
import { Pages } from "@/collections/pages"
import { Posts } from "@/collections/posts"
import { Media } from "@/collections/media"
import { Users } from "@/collections/users"
import { Categories } from "@/collections/categories"
import { Team } from "@/collections/team"
import { Services } from "@/collections/services"
import { Testimonials } from "@/collections/testimonials"
import { Templates } from "@/collections/templates"
import { getURIIndexCollection } from "@/collections/uri-index"
import { PublicationWork } from "@/website/publication/collection"
import { Header } from "@/globals/header/config"
import { Footer } from "@/globals/footer/config"
import { createSettings } from "@/globals/settings"
import { FormBlock } from "@/blocks/form/config"
import { MediaBlock } from "@/blocks/media/config"
import { websiteCollections, assertWebsiteInventory } from "@/website/collection-metadata"
import { websiteLinksPlugin } from "@/plugins/website-links"
import {
  websiteForms,
  websiteRedirects,
  websiteSearch,
  websiteNestedDocs,
} from "@/plugins"
import { smartsiteMcp } from "@/mcp/plugin"
import site from "@/site.config"
import { createAdmin } from "@/admin/config"
import db, { databaseInfo } from "@/payload/db/config"
import { email } from "@/payload/email/config"
import jobs from "@/payload/jobs/config"
import { getServerSideURL } from "@/utilities/get-url"
import { lexicalEditor } from "@payloadcms/richtext-lexical"
import path from "path"
import { buildConfig } from "payload"
import sharp from "sharp"
import { fileURLToPath } from "url"

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Register a collection once here. Each definition owns its fields, access and hooks.
const collections = [
  Pages,
  Posts,
  Media,
  Users,
  Categories,
  Team,
  Services,
  Testimonials,
  Templates,
]
const inventory = websiteCollections({ collections })

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
  admin: createAdmin(inventory),
  blocks: [FormBlock, MediaBlock],
  collections: [
    ...collections,
    getURIIndexCollection(inventory.map(item => item.slug as any)),
    PublicationWork,
    UpgradeReceipts,
  ],
  cors: [getServerSideURL()].filter(Boolean),
  db,
  editor: lexicalEditor(),
  email,
  folders: {
    browseByFolder: true,
    slug: "payload-folders",
    fieldName: "folder",
  },
  globals: [Header, Footer, createSettings(inventory)],
  plugins: [
    websiteRedirects,
    websiteForms,
    ...(site.features.search.enabled ? [websiteSearch(inventory)] : []),
    websiteNestedDocs,
    smartsiteMcp({ enabled: true }),
    websiteLinksPlugin,
    assertWebsiteInventory(inventory),
  ],
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
    }
  },
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
})

export default config
