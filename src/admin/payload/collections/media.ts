import path from "path"
import type { CollectionConfig } from "payload"
import { fileURLToPath } from "url"

import { anyone } from "@/admin/payload/access/anyone"
import { authenticated } from "@/admin/payload/access/authenticated"
import smartSiteConfig from "@/smartsite.config"

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Create upload configuration based on storage type
function createUploadConfig() {
  const storage = smartSiteConfig.settings.media.storage
  
  // For external storage providers (vercel, s3, uploadThing), 
  // the storage plugin handles file management, so we don't need staticDir
  if (storage !== "local") {
    return {
      adminThumbnail: "thumbnail",
      focalPoint: true,
      imageSizes: [
        {
          name: "thumbnail",
          width: 300,
        },
        {
          name: "square",
          width: 500,
          height: 500,
        },
        {
          name: "small",
          width: 600,
        },
        {
          name: "medium",
          width: 900,
        },
        {
          name: "large",
          width: 1400,
        },
        {
          name: "xlarge",
          width: 1920,
        },
        {
          name: "og",
          width: 1200,
          height: 630,
          crop: "center",
        },
      ],
    }
  }
  
  // For local storage, include staticDir
  return {
    staticDir: path.resolve(dirname, "../../../../public/media"),
    adminThumbnail: "thumbnail",
    focalPoint: true,
    imageSizes: [
      {
        name: "thumbnail",
        width: 300,
      },
      {
        name: "square",
        width: 500,
        height: 500,
      },
      {
        name: "small",
        width: 600,
      },
      {
        name: "medium",
        width: 900,
      },
      {
        name: "large",
        width: 1400,
      },
      {
        name: "xlarge",
        width: 1920,
      },
      {
        name: "og",
        width: 1200,
        height: 630,
        crop: "center",
      },
    ],
  }
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
  },
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
