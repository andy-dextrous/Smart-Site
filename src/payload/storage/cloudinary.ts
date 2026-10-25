// server-only - removed for type generation compatibility
import { cloudStoragePlugin } from "@payloadcms/plugin-cloud-storage"
import type {
  Adapter,
  CollectionOptions,
  GenerateFileURL,
  GeneratedAdapter,
  HandleDelete,
  HandleUpload,
} from "@payloadcms/plugin-cloud-storage/types"
import { v2 as cloudinary } from "cloudinary"
import type { UploadApiResponse } from "cloudinary"
import type { Plugin } from "payload"

export function cloudinaryStorage(providerOptions: Record<string, unknown> = {}): Plugin {
  const cloudName =
    getString(getValue(providerOptions, "cloudName")) ||
    getString(getValue(providerOptions, "cloud")) ||
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_NAME
  const apiKey =
    getString(getValue(providerOptions, "apiKey")) || process.env.CLOUDINARY_API_KEY
  const apiSecret =
    getString(getValue(providerOptions, "apiSecret")) || process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    console.warn("⚠️  Cloudinary storage configured but missing credentials")
    console.warn(
      "   Required: CLOUDINARY_CLOUD_NAME (or CLOUDINARY_NAME), CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET"
    )
    throw new Error("Cloudinary storage requires cloud name, API key and API secret")
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  })

  const folder = getString(getValue(providerOptions, "folder")) || "media"
  const uploadOptions = getRecord(getValue(providerOptions, "uploadOptions"))
  const destroyOptions = getRecord(getValue(providerOptions, "destroyOptions"))
  const deliveryOptions = getRecord(getValue(providerOptions, "deliveryOptions"))
  const disableLocalStorage =
    getBoolean(getValue(providerOptions, "disableLocalStorage")) ?? true
  const disablePayloadAccessControl = getBoolean(
    getValue(providerOptions, "disablePayloadAccessControl")
  )
  const collectionsOverride = getValue(providerOptions, "collections")

  const adapter = buildCloudinaryAdapter({
    folder,
    uploadOptions,
    destroyOptions,
  })

  const generateFileURL = buildCloudinaryFileURLResolver({
    folder,
    deliveryOptions,
  })

  const collections = buildCloudinaryCollections({
    adapter,
    collectionsOverride,
    disableLocalStorage,
    disablePayloadAccessControl,
    generateFileURL,
  })

  return cloudStoragePlugin({ collections })
}

type CloudinaryAdapterOptions = {
  folder: string
  uploadOptions?: UnknownRecord
  destroyOptions?: UnknownRecord
}

type CloudinaryFileURLOptions = {
  folder: string
  deliveryOptions?: UnknownRecord
}

type CloudinaryCollectionsOptions = {
  adapter: Adapter
  collectionsOverride: unknown
  disableLocalStorage: boolean
  disablePayloadAccessControl?: boolean
  generateFileURL: GenerateFileURL
}

type CloudinaryCollectionsMap = Parameters<typeof cloudStoragePlugin>[0]["collections"]

type CloudinaryCollectionEntry = CollectionOptions

function buildCloudinaryAdapter(options: CloudinaryAdapterOptions): Adapter {
  return function adapter(): GeneratedAdapter {
    async function handleUpload(input: Parameters<HandleUpload>[0]): Promise<void> {
      const uploadResult = await uploadToCloudinary(input.file, options)

      input.file.filename = uploadResult.public_id

      const fileRecord = input.file as unknown as UnknownRecord

      if (typeof uploadResult.secure_url === "string") {
        fileRecord.url = uploadResult.secure_url
      }

      if (typeof uploadResult.bytes === "number") {
        input.file.filesize = uploadResult.bytes
      }

      if (typeof uploadResult.width === "number") {
        fileRecord.width = uploadResult.width
      }

      if (typeof uploadResult.height === "number") {
        fileRecord.height = uploadResult.height
      }

      const resolvedMime = resolveCloudinaryMimeType(
        uploadResult.resource_type,
        uploadResult.format
      )

      if (resolvedMime) {
        input.file.mimeType = resolvedMime
      }
    }

    async function handleDelete(input: Parameters<HandleDelete>[0]): Promise<void> {
      if (typeof input.filename !== "string" || input.filename.length === 0) {
        return
      }

      const normalizedFilename = input.filename.replace(/\.[^/.]+$/, "")

      try {
        await cloudinary.uploader.destroy(
          `${options.folder}/${normalizedFilename}`,
          options.destroyOptions
        )
      } catch (error) {
        console.error("Cloudinary delete error:", error)
      }
    }

    function staticHandler(): Response {
      return new Response("Cloudinary serves assets directly", { status: 501 })
    }

    return {
      name: "cloudinary-adapter",
      handleUpload,
      handleDelete,
      staticHandler,
    }
  }
}

function buildCloudinaryFileURLResolver(
  options: CloudinaryFileURLOptions
): GenerateFileURL {
  const delivery = {
    secure: true,
    ...(options.deliveryOptions ?? {}),
  }

  function generate(args: Parameters<GenerateFileURL>[0]): string {
    const filename = normalizeCloudinaryFilename(args.filename)

    if (!filename) {
      return ""
    }

    const includesFolder = filename.includes("/")
    const publicId =
      includesFolder || options.folder.length === 0
        ? filename
        : `${options.folder}/${filename}`

    return cloudinary.url(publicId, delivery)
  }

  return generate
}

function buildCloudinaryCollections(
  options: CloudinaryCollectionsOptions
): CloudinaryCollectionsMap {
  const overrides = resolveCloudinaryCollectionOverrides(options.collectionsOverride)
  const mutableResult: Record<string, CloudinaryCollectionEntry | null> = {}

  if (overrides) {
    for (const [slug, value] of Object.entries(overrides)) {
      const normalized = normalizeCloudinaryCollectionOption(value, options)

      if (normalized) {
        mutableResult[slug] = normalized
      }
    }
  }

  if (!Object.prototype.hasOwnProperty.call(mutableResult, "media")) {
    mutableResult.media = buildCloudinaryCollectionOption(options)
  }

  return mutableResult as CloudinaryCollectionsMap
}

function normalizeCloudinaryCollectionOption(
  value: unknown,
  options: CloudinaryCollectionsOptions
): CloudinaryCollectionEntry | null {
  if (value === false) {
    return null
  }

  if (value === true || value === undefined) {
    return buildCloudinaryCollectionOption(options)
  }

  if (!isRecord(value)) {
    return buildCloudinaryCollectionOption(options)
  }

  return {
    ...buildCloudinaryCollectionOption(options),
    ...value,
    adapter: options.adapter,
  }
}

function buildCloudinaryCollectionOption(
  options: CloudinaryCollectionsOptions
): CloudinaryCollectionEntry {
  const entry: Partial<CloudinaryCollectionEntry> = {
    adapter: options.adapter,
    disableLocalStorage: options.disableLocalStorage,
    generateFileURL: options.generateFileURL,
  }

  if (options.disablePayloadAccessControl) {
    entry.disablePayloadAccessControl = true
  }

  return entry as CloudinaryCollectionEntry
}

function resolveCloudinaryCollectionOverrides(
  value: unknown
): Record<string, unknown> | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  return value
}

function uploadToCloudinary(
  file: Parameters<HandleUpload>[0]["file"],
  options: CloudinaryAdapterOptions
): Promise<UploadApiResponse> {
  const fileRecord = file as unknown as UnknownRecord
  const sourceName = (
    typeof fileRecord.filename === "string" && fileRecord.filename.length > 0
      ? fileRecord.filename
      : typeof fileRecord.name === "string" && fileRecord.name.length > 0
        ? fileRecord.name
        : "asset"
  ) as string

  const uploadConfig = buildCloudinaryUploadConfig(sourceName, options)

  if (!fileRecord.buffer) {
    return Promise.reject(new Error("Cloudinary upload requires a file buffer"))
  }

  return new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(uploadConfig, (error, result) => {
      if (error) {
        reject(error)
        return
      }

      if (!result) {
        reject(new Error("Cloudinary upload returned no result"))
        return
      }

      resolve(result)
    })

    stream.end(fileRecord.buffer as Buffer)
  })
}

function buildCloudinaryUploadConfig(
  filename: string,
  options: CloudinaryAdapterOptions
): Record<string, unknown> {
  const baseName = sanitizeCloudinaryFilename(filename)
  const config: Record<string, unknown> = {
    resource_type: "auto",
    overwrite: false,
    use_filename: true,
    unique_filename: false,
    public_id: baseName,
  }

  if (options.folder.length > 0) {
    config.folder = options.folder
  }

  if (options.uploadOptions) {
    Object.assign(config, options.uploadOptions)
  }

  return config
}

function sanitizeCloudinaryFilename(filename: string): string {
  const withoutExtension = filename.replace(/\.[^/.]+$/, "")
  const trimmed = withoutExtension.trim()

  if (!trimmed) {
    return "asset"
  }

  return trimmed.replace(/[^a-zA-Z0-9/_-]+/g, "-")
}

function normalizeCloudinaryFilename(value: unknown): string {
  if (typeof value === "string") {
    const trimmed = value.trim()

    if (trimmed.length > 0) {
      return trimmed
    }
  }

  return ""
}

function resolveCloudinaryMimeType(
  resourceType: string | undefined,
  format: string | undefined
): string | undefined {
  if (!format) {
    return undefined
  }

  if (!resourceType || resourceType === "image") {
    return `image/${format}`
  }

  if (resourceType === "video") {
    return `video/${format}`
  }

  if (resourceType === "raw") {
    return format
  }

  return `${resourceType}/${format}`
}

/*************************************************************************/
/*  PROVIDER UTILITIES
/*************************************************************************/

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null
}

function getRecord(value: unknown): UnknownRecord | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  return value
}

function getString(value: unknown): string | undefined {
  if (typeof value === "string" && value.length) {
    return value
  }

  return undefined
}

function getValue(record: UnknownRecord | undefined, key: string): unknown {
  if (!record) {
    return undefined
  }

  return record[key]
}

function getBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value
  }

  return undefined
}
