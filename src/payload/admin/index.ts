import path from "path"
import { fileURLToPath } from "url"
import { Users } from "@/payload/collections/users"
import components from "@/payload/components/config"
import { frontendCollections } from "../collections/frontend"
import { generatePreviewPath } from "@/utilities/generate-preview-path"
import type {
  CollectionSlug,
  PayloadRequest,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
  Locale,
  BasePayload,
} from "payload"
import { getServerSideURL } from "@/utilities/get-url"

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const admin = {
  user: Users.slug,
  suppressHydrationWarning: true,
  importMap: {
    baseDir: path.resolve(dirname),
  },
  theme: "dark" as const,
  components,
  meta: {
    title: "Admin | smart site",
    description: "Advanced admin panel for high-performance websites",
    icons: [
      {
        rel: "icon",
        type: "image/png",
        url: "/favicon.png",
      },
    ],
  },
  livePreview: {
    collections: frontendCollections.map(collection => collection.slug),
    globals: ["header", "footer"],
    url: (args: {
      collectionConfig?: SanitizedCollectionConfig
      data: Record<string, any>
      globalConfig?: SanitizedGlobalConfig
      locale: Locale
      payload: BasePayload
      req: PayloadRequest
    }) => {
      const { data, collectionConfig, req } = args
      const collection = collectionConfig?.slug as CollectionSlug
      const slug = typeof data?.slug === "string" ? data.slug : ""

      if (!collection || !slug) {
        return process.env.NEXT_PUBLIC_URL || "http://localhost:3000"
      }

      const previewPath = generatePreviewPath({
        slug,
        collection,
        req,
        data,
      })

      // Add livePreview parameter for admin bar hiding
      return previewPath + "&livePreview=true"
    },
    breakpoints: [
      {
        label: "Mobile",
        name: "mobile",
        width: 375,
        height: 667,
      },
      {
        label: "Tablet",
        name: "tablet",
        width: 768,
        height: 1024,
      },
      {
        label: "Desktop",
        name: "desktop",
        width: 1440,
        height: 900,
      },
    ],
  },
  avatar: {
    Component: "@/payload/components/backend/avatar#Avatar",
  },
}

export default admin
