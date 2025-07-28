import type { Payload } from "payload"
import * as fs from "fs"
import * as path from "path"
import { nanoid } from "nanoid"

export interface ImageDefinition {
  url: string
  alt: string
  caption?: string
  filename?: string
}

export interface ImageSet {
  [key: string]: ImageDefinition
}

// Local fallback images
const LOCAL_FALLBACKS = {
  general: path.join(process.cwd(), "public/assets/images/placeholder.jpg"),
  person: path.join(process.cwd(), "public/assets/images/person-placeholder.jpg"),
}

/*************************************************************************/
/*  IMAGE DOWNLOADER UTILITY
/*
/*  This utility allows each seed file to define and download its own images,
/*  creating a self-contained approach where images are managed alongside
/*  the content that uses them.
/*
/*  USAGE:
/*  const images: ImageSet = {
/*    hero: {
/*      url: 'https://example.com/image.jpg',
/*      alt: 'Hero image description',
/*      caption: 'Professional photography'
/*    }
/*  }
/*
/*  const media = await downloadImages(payload, images)
/*  // Use media.hero in your content
/*************************************************************************/

// Helper function to determine which fallback image to use
function getFallbackImagePath(key: string, alt: string): string {
  const lowerKey = key.toLowerCase()
  const lowerAlt = alt.toLowerCase()

  // Use person placeholder for testimonials, people, etc.
  if (
    lowerKey.includes("person") ||
    lowerKey.includes("testimonial") ||
    lowerKey.includes("client") ||
    lowerAlt.includes("person") ||
    lowerAlt.includes("testimonial") ||
    lowerAlt.includes("client")
  ) {
    return LOCAL_FALLBACKS.person
  }

  // Use general placeholder for everything else
  return LOCAL_FALLBACKS.general
}

// Helper function to insert nanoid before file extension
function generateUniqueFilename(
  baseFilename: string | undefined,
  key: string,
  uniqueId: string
): string {
  if (baseFilename) {
    // If filename already has extension, insert nanoid before it
    const lastDotIndex = baseFilename.lastIndexOf(".")
    if (lastDotIndex > 0) {
      const nameWithoutExt = baseFilename.substring(0, lastDotIndex)
      const extension = baseFilename.substring(lastDotIndex)
      return `${nameWithoutExt}-${uniqueId}${extension}`
    } else {
      // No extension found, append nanoid and default .jpg
      return `${baseFilename}-${uniqueId}.jpg`
    }
  } else {
    // No filename provided, use key as base
    return `${key}-${uniqueId}.jpg`
  }
}

export async function downloadImages(
  payload: Payload,
  images: ImageSet,
  context?: any
): Promise<Record<string, any>> {
  const mediaItems: Record<string, any> = {}

  // Generate a unique nanoid for this batch to prevent filename collisions and cache issues
  const batchId = nanoid(8) // 8 characters is short but sufficiently unique

  for (const [key, definition] of Object.entries(images)) {
    try {
      payload.logger.info(`Downloading image: ${key}`)

      const response = await fetch(definition.url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const buffer = await response.arrayBuffer()
      const filename = generateUniqueFilename(definition.filename, key, batchId)

      const mediaItem = await payload.create({
        collection: "media",
        data: {
          alt: definition.alt,
          caption: definition.caption,
        },
        file: {
          name: filename,
          data: Buffer.from(buffer),
          mimetype: "image/jpeg",
          size: buffer.byteLength,
        },
        context,
      })

      mediaItems[key] = mediaItem
      payload.logger.info(`Successfully downloaded and created media: ${key}`)
    } catch (error) {
      payload.logger.warn(
        `Failed to download image ${key}: ${error}. Using local fallback.`
      )

      // Use local fallback image
      try {
        const fallbackPath = getFallbackImagePath(key, definition.alt)
        const fallbackBuffer = fs.readFileSync(fallbackPath)
        const fallbackFilename = generateUniqueFilename(
          definition.filename,
          `${key}-fallback`,
          batchId
        )

        const fallbackItem = await payload.create({
          collection: "media",
          data: {
            alt: definition.alt,
            caption: definition.caption,
          },
          file: {
            name: fallbackFilename,
            data: fallbackBuffer,
            mimetype: "image/jpeg",
            size: fallbackBuffer.length,
          },
          context,
        })

        mediaItems[key] = fallbackItem
        payload.logger.info(`Created media item using local fallback for: ${key}`)
      } catch (fallbackError) {
        payload.logger.error(`Failed to create fallback for ${key}:`, fallbackError)
        // Create a minimal object to prevent undefined errors
        mediaItems[key] = {
          id: null,
          alt: definition.alt,
          caption: definition.caption,
        }
      }
    }
  }

  return mediaItems
}
