import { refreshRelatedContent, refreshDeletedContent } from "@/website/publication/hooks"
import path from "path"
import type { CollectionConfig, ImageUploadFormatOptions, UploadConfig } from "payload"
import { fileURLToPath } from "url"

import { anyone } from "@/access/anyone"
import { authenticated } from "@/access/authenticated"
import { CollectionCustomMetadata } from "@/types/icon-types"

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const mediaDirectory = process.env.SMARTSITE_MEDIA_DIRECTORY
if (mediaDirectory && !path.isAbsolute(mediaDirectory))
  throw new Error("SMARTSITE_MEDIA_DIRECTORY must be an absolute persistent directory")

export const Media: CollectionConfig = {
  hooks: { afterChange: [refreshRelatedContent], afterDelete: [refreshDeletedContent] },
  slug: "media",
  custom: { smartsite: { mcp: true } },
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
  upload: {
    staticDir: mediaDirectory || path.resolve(dirname, "../../public/media"),
    focalPoint: true,
    adminThumbnail: "thumbnail",
    formatOptions: { format: "webp", options: { quality: 85 } },
    imageSizes: [
      {
        name: "thumbnail",
        width: 300,
        formatOptions: { format: "webp", options: { quality: 75 } },
      },
      { name: "square", width: 500, height: 500 },
      { name: "small", width: 600 },
      { name: "medium", width: 900 },
      { name: "large", width: 1400 },
      { name: "xlarge", width: 1920 },
      { name: "og", width: 1200, height: 630, crop: "center" },
    ],
  },
}
