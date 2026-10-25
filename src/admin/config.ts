import path from "path"
import { fileURLToPath } from "url"
import { Users } from "@/collections/users"
import components from "@/admin/components/config"
import type { WebsiteCollection } from "@/website/collection-metadata"
import { generatePreviewPath } from "@/utilities/generate-preview-path"
import type {
  CollectionSlug,
  PayloadRequest,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
  Locale,
  BasePayload,
} from "payload"

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const disableAdmin = process.env.SMARTSITE_DISABLE_ADMIN === "1"

export function createAdmin(frontendCollections: WebsiteCollection[]) {
  return disableAdmin
    ? {
        user: Users.slug,
        suppressHydrationWarning: true,
        importMap: {
          baseDir: path.resolve(dirname),
        },
        autoLogin: false as const,
        components: {},
        meta: {
          title: "SmartSite Admin",
          description: "",
          icons: [],
        },
        livePreview: {
          collections: [],
          globals: [],
          url: () => process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
          breakpoints: [],
        },
      }
    : {
        user: Users.slug,
        suppressHydrationWarning: true,
        importMap: {
          baseDir: path.resolve(dirname),
        },
        autoLogin: (() => {
          if (
            process.env.NODE_ENV === "development" &&
            process.env.PAYLOAD_ADMIN_EMAIL &&
            process.env.PAYLOAD_ADMIN_PASSWORD
          ) {
            return {
              email: process.env.PAYLOAD_ADMIN_EMAIL,
              password: process.env.PAYLOAD_ADMIN_PASSWORD,
            }
          }
          return false as const
        })(),
        components,
        meta: {
          title: "Admin | Smart Site",
          description: "Advanced admin panel",
          icons: [{ rel: "icon", type: "image/png", url: "/favicon.png" }],
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
      }
}
