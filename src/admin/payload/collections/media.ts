import path from "path"
import type { CollectionConfig, ImageUploadFormatOptions, UploadConfig } from "payload"
import { fileURLToPath } from "url"

import { anyone } from "@/admin/payload/access/anyone"
import { authenticated } from "@/admin/payload/access/authenticated"
import { CollectionCustomMetadata } from "@/admin/payload/types/icon-types"
import { getSmartSiteConfig } from "@/admin/config"

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

function resolveLocalStaticDir(staticDir?: string): string {
  const defaultDir = path.resolve(dirname, "../../../../public/media")

  if (!staticDir || staticDir.trim().length === 0) {
    return defaultDir
  }

  const trimmed = staticDir.trim()

  if (trimmed === "@public") {
    return path.join(process.cwd(), "public")
  }

  if (trimmed.startsWith("@public/")) {
    const relative = trimmed.slice("@public/".length)
    return path.join(process.cwd(), "public", relative)
  }

  return path.isAbsolute(trimmed) ? trimmed : path.resolve(process.cwd(), trimmed)
}

function buildFormatOptions(quality?: number): ImageUploadFormatOptions | undefined {
  if (typeof quality !== "number") {
    return undefined
  }

  return {
    format: "webp",
    options: { quality },
  }
}

function resolveMediaProvider(): "local" | "vercel-blob" | "s3" | "cloudinary" | "uploadthing" {
  const smartSiteConfig = getSmartSiteConfig()
  const mediaConfig = (smartSiteConfig.collections.media as any) || {}
  const provider = mediaConfig.provider as string | undefined

  // Config is the source of truth - default to "local" if not specified
  switch (provider) {
    case "vercel-blob":
      if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.VERCEL_BLOB_TOKEN) {
        console.error(
          "❌ Media provider set to 'vercel-blob' in smartsite.config.ts but BLOB_READ_WRITE_TOKEN or VERCEL_BLOB_TOKEN not found in environment"
        )
      }
      return "vercel-blob"
    case "s3":
    case "cloudinary":
    case "uploadthing":
      return provider
    default:
      return "local"
  }
}

function resolveMediaDir(): string | undefined {
  const smartSiteConfig = getSmartSiteConfig()
  const mediaConfig = (smartSiteConfig.collections.media as any) || {}
  if (resolveMediaProvider() !== "local") return undefined
  return resolveLocalStaticDir(mediaConfig.staticDir)
}

export const mediaInfo = {
  provider: resolveMediaProvider(),
  dir: resolveMediaDir(),
}

function createUploadConfig(): UploadConfig {
  const smartSiteConfig = getSmartSiteConfig()
  const mediaConfig = smartSiteConfig.collections.media as any

  if (!mediaConfig || mediaConfig.enabled === false) {
    return {}
  }

  const imageConfig = smartSiteConfig.images
  const qualityDefaults = imageConfig?.quality || { default: 85 }

  const qualityMap: Record<string, number | undefined> = {
    ...qualityDefaults,
  }

  if (typeof qualityMap.default !== "number") {
    qualityMap.default = 85
  }

  const imageSizes = (imageConfig?.sizes || []).map(size => {
    const specificQuality = qualityMap[size.name as keyof typeof qualityMap]
    const formatOptions = buildFormatOptions(specificQuality)

    return {
      name: size.name,
      width: size.width,
      ...(size.height && { height: size.height }),
      ...(size.crop && { crop: size.crop }),
      ...(formatOptions && { formatOptions }),
    }
  })

  const adminThumbnailName = imageSizes.find(size => size.name === "thumbnail")
    ? "thumbnail"
    : imageSizes[0]?.name

  const baseFormatOptions = buildFormatOptions(qualityMap.default)
  const provider = mediaInfo.provider

  if (provider !== "local") {
    return {
      focalPoint: true,
      imageSizes,
      ...(adminThumbnailName && { adminThumbnail: adminThumbnailName }),
      ...(baseFormatOptions && { formatOptions: baseFormatOptions }),
    } as UploadConfig
  }

  const staticDir = mediaInfo.dir || resolveLocalStaticDir(mediaConfig.staticDir)

  return {
    staticDir,
    focalPoint: true,
    imageSizes,
    ...(adminThumbnailName && { adminThumbnail: adminThumbnailName }),
    ...(baseFormatOptions && { formatOptions: baseFormatOptions }),
  } as UploadConfig
}

export const Media: CollectionConfig = {
  slug: "media",
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    hideAPIURL: process.env.NODE_ENV === "production",
    custom: {
      icon: {
        type: "react-icons",
        name: "md/MdOutlinePermMedia",
      },
    } as CollectionCustomMetadata,
  },
  folders: true,
  defaultPopulate: {
    alt: true,
    filename: true,
    height: true,
    mimeType: true,
    url: true,
    width: true,
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: false,
    },
    {
      name: "caption",
      type: "textarea",
    },
  ],
  upload: createUploadConfig(),
}
