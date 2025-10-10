// server-only - removed for type generation compatibility
import type { Plugin } from "payload"
import type { SmartSiteConfig, MediaCollectionConfig } from "./defaults"
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob"

/*************************************************************************/
/*  STORAGE PLUGIN RESOLVER
/*************************************************************************/

export function resolveStoragePlugins(config: SmartSiteConfig): Plugin[] {
  const plugins: Plugin[] = []
  
  const mediaConfig = config.collections.media as MediaCollectionConfig
  
  // Handle media disabled case
  if (!mediaConfig || !mediaConfig.enabled) {
    return []
  }
  
  // Config is the source of truth - default to "local" if not specified
  const provider = mediaConfig?.provider || "local"

  switch (provider) {
    case "vercel-blob":
      plugins.push(...configureVercelStorage(config))
      break
      
    case "s3":
      plugins.push(...configureS3Storage(config))
      break
      
    case "cloudinary":
      plugins.push(...configureCloudinaryStorage(config))
      break
      
    case "uploadthing":
      plugins.push(...configureUploadThingStorage(config))
      break
      
    case "local":
    default:
      // Local storage doesn't need a plugin
      break
  }
  
  return plugins
}

/*************************************************************************/
/*  VERCEL BLOB STORAGE
/*************************************************************************/

function configureVercelStorage(config: SmartSiteConfig): Plugin[] {
  const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_TOKEN
  
  // During import map generation, we need to include the plugin even without a token
  // The token will be validated at runtime
  const isDevelopment = process.env.NODE_ENV === "development"
  const isGeneratingImportMap = process.argv.includes("generate:importmap")
  
  if (!token && !isGeneratingImportMap) {
    console.warn("⚠️  Vercel blob storage configured but no token found")
    console.warn("   Set BLOB_READ_WRITE_TOKEN or VERCEL_BLOB_TOKEN env variable")
    // In development, still include the plugin for import map generation
    if (!isDevelopment) {
      return []
    }
  }
  
  const mediaConfig = config.collections.media as MediaCollectionConfig
  const storageConfig = mediaConfig?.config || {}
  
  return [
    vercelBlobStorage({
      collections: {
        media: true,
        ...(storageConfig?.collections || {})
      },
      token: token || "placeholder-for-import-map-generation",
      cacheControlMaxAge: storageConfig?.cacheMaxAge || 60 * 60 * 24 * 365,
      ...(storageConfig?.vercel || {})
    })
  ]
}

/*************************************************************************/
/*  S3 STORAGE
/*************************************************************************/

function configureS3Storage(config: SmartSiteConfig): Plugin[] {
  const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY
  const bucket = process.env.S3_BUCKET || process.env.AWS_BUCKET
  const region = process.env.S3_REGION || process.env.AWS_REGION || "us-east-1"
  
  if (!accessKeyId || !secretAccessKey || !bucket) {
    console.warn("⚠️  S3 storage configured but missing credentials")
    console.warn("   Required: S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET")
    return []
  }
  
  // S3 storage not yet implemented - package not available
  console.warn("⚠️  S3 storage not yet available")
  console.warn("   Will be available when @payloadcms/storage-s3 is released")
  return []
}

/*************************************************************************/
/*  CLOUDINARY STORAGE
/*************************************************************************/

function configureCloudinaryStorage(config: SmartSiteConfig): Plugin[] {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  
  if (!cloudName || !apiKey || !apiSecret) {
    console.warn("⚠️  Cloudinary storage configured but missing credentials")
    console.warn("   Required: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET")
    return []
  }
  
  // Cloudinary storage not yet implemented - package not available
  console.warn("⚠️  Cloudinary storage not yet available")
  console.warn("   Will be available when @payloadcms/storage-cloudinary is released")
  return []
}

/*************************************************************************/
/*  UPLOADTHING STORAGE
/*************************************************************************/

function configureUploadThingStorage(config: SmartSiteConfig): Plugin[] {
  const secret = process.env.UPLOADTHING_SECRET
  const appId = process.env.UPLOADTHING_APP_ID
  
  if (!secret || !appId) {
    console.warn("⚠️  UploadThing storage configured but missing credentials")
    console.warn("   Required: UPLOADTHING_SECRET, UPLOADTHING_APP_ID")
    return []
  }
  
  // UploadThing storage not yet implemented - package not available
  console.warn("⚠️  UploadThing storage not yet available")
  console.warn("   Will be available when @payloadcms/storage-uploadthing is released")
  return []
}
