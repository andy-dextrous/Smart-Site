import path from "path"
import type { CollectionConfig } from "payload"
import { fileURLToPath } from "url"

import { anyone } from "@/admin/payload/access/anyone"
import { authenticated } from "@/admin/payload/access/authenticated"
import { CollectionCustomMetadata } from "@/admin/payload/types/icon-types"
import { getSmartSiteConfig } from "@/admin/config"

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Create upload configuration based on storage type
// function createUploadConfig() {
//   const config = getSmartSiteConfig()
//   const mediaConfig = config.collections.media as any

//   // Check if media is disabled
//   if (!mediaConfig || !mediaConfig.enabled) {
//     return {}
//   }

//   const storage = mediaConfig.provider || "local"

//   const imageSizes = config.images.sizes.map(size => ({
//     name: size.name,
//     width: size.width,
//     ...(size.height && { height: size.height }),
//     ...(size.crop && { crop: size.crop }),
//   }))

//   if (storage !== "local") {
//     return {
//       adminThumbnail: "thumbnail",
//       focalPoint: true,
//       imageSizes,
//     }
//   }

//   return {
//     staticDir: path.resolve(dirname, "../../../../public/media"),
//     adminThumbnail: "thumbnail",
//     focalPoint: true,
//     imageSizes,
//   }
// }

function createUploadConfig() {
  const config = getSmartSiteConfig()
  const mediaConfig = config.collections.media as any

  // For external storage providers (vercel, s3, uploadThing),
  // the storage plugin handles file management, so we don't need staticDir
  if (mediaConfig.provider !== "local") {
    return {
      // adminThumbnail: "thumbnail",
      // focalPoint: true,
      // imageSizes: [
      //   {
      //     name: "thumbnail",
      //     width: 300,
      //   },
      //   {
      //     name: "square",
      //     width: 500,
      //     height: 500,
      //   },
      //   {
      //     name: "small",
      //     width: 600,
      //   },
      //   {
      //     name: "medium",
      //     width: 900,
      //   },
      //   {
      //     name: "large",
      //     width: 1400,
      //   },
      //   {
      //     name: "xlarge",
      //     width: 1920,
      //   },
      //   {
      //     name: "og",
      //     width: 1200,
      //     height: 630,
      //     crop: "center",
      //   },
      // ],
    }
  }

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
