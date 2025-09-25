import { createHash } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"

import type {
  Plugin,
  PayloadRequest,
  CollectionConfig,
  GlobalConfig,
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from "payload"
import { handleEndpoints } from "payload"
import { revalidateTag } from "next/cache"

import { shouldPreventHooks } from "@/admin/utilities/prevent-hooks"
import { AISettings } from "@/admin/payload/globals/ai-settings"
import { sections } from "@/components/sections/config"

const REGISTRY_TAG = "ai-registry"
const AUTH_HEADER = "authorization"
const REGISTRY_ENDPOINT = "/ai/registry"
const REST_ENDPOINT = "/ai/rest"
const COLLECTION_ENDPOINT = "/ai/collections"
const GLOBAL_ENDPOINT = "/ai/globals"

type FieldManifest = Record<string, unknown>

type EndpointConfig = {
  path: string
  method: "connect" | "delete" | "get" | "head" | "options" | "patch" | "post" | "put"
  handler: (req: PayloadRequest) => Promise<Response>
  custom?: Record<string, unknown>
}

type CollectionManifest = {
  slug: string
  labels?: unknown
  admin?: Record<string, unknown>
  auth?: unknown
  timestamps?: boolean
  versions?: Record<string, unknown>
  upload?: Record<string, unknown>
  custom?: unknown
  fields: FieldManifest[]
}

type GlobalManifest = {
  slug: string
  label?: unknown
  admin?: Record<string, unknown>
  custom?: unknown
  fields: FieldManifest[]
}

type BlockManifest = {
  slug: string
  interfaceName?: string
  labels?: unknown
  admin?: Record<string, unknown>
  imageURL?: string
  fields?: FieldManifest[]
}

type RegistrySnapshot = ReturnType<typeof buildResponseBody>

type RouteParamValue = string | string[] | undefined

type RegistryDebugOptions = {
  enabled: boolean
  targetPath: string
}

const FIELD_KEYS = [
  "name",
  "type",
  "label",
  "required",
  "localized",
  "index",
  "unique",
  "hidden",
  "access",
  "defaultValue",
  "min",
  "max",
  "minLength",
  "maxLength",
  "defaultMax",
  "defaultMin",
  "maxRows",
  "minRows",
  "hasMany",
  "relationTo",
  "options",
  "admin",
  "fields",
  "labels",
  "filters",
  "blocks",
  "tabs",
  "requiredFields",
  "validate",
  "indexDepth",
  "depth",
  "extensions",
]

const FIELD_ADMIN_KEYS = [
  "description",
  "help",
  "placeholder",
  "width",
  "position",
  "layout",
  "hidden",
  "readOnly",
  "disabled",
]

const COLLECTION_ADMIN_KEYS = [
  "useAsTitle",
  "group",
  "description",
  "defaultColumns",
  "hidden",
  "livePreview",
  "preview",
  "enableRichTextLink",
  "enableRichTextRelationship",
]

const GLOBAL_ADMIN_KEYS = ["group", "description"]
const BLOCK_ADMIN_KEYS = ["group", "description"]

const AUTH_KEYS = [
  "useAPIKey",
  "tokenExpiration",
  "maxLoginAttempts",
  "lockTime",
  "loginWithUsername",
  "cookies",
  "forgotPassword",
  "useSessions",
  "verify",
  "strategies",
]

const UPLOAD_KEYS = ["staticURL", "disableLocalStorage", "imageSizes", "mimeTypes"]
const VERSION_KEYS = ["drafts", "maxPerDoc", "retainDeleted"] as const

function extractBearerToken(header: string | null): string | null {
  if (!header) return null
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match ? match[1] : null
}

function hasValidBearer(req: PayloadRequest): boolean {
  const authHeader = req.headers.get(AUTH_HEADER)
  const token = extractBearerToken(authHeader)
  const expected = process.env.AI_AGENT_API_KEY
  return Boolean(token && expected && token === expected)
}

function ensureApiKey(): string | null {
  const apiKey = process.env.AI_AGENT_API_KEY
  if (!apiKey || apiKey.length === 0) {
    return null
  }
  return apiKey
}

function unauthorized(): Response {
  return Response.json({ error: "Unauthorized" }, { status: 401 })
}

function resolveDebugOptions(): RegistryDebugOptions {
  const enabledEnv = process.env.DEBUG_AI_REGISTRY ?? ""
  const enabled = ["1", "true", "yes"].includes(enabledEnv.toLowerCase())
  const defaultPath = join(process.cwd(), "tmp", "ai-registry-debug.json")
  const targetPath = process.env.DEBUG_AI_REGISTRY_FILE ?? defaultPath
  return { enabled, targetPath }
}

function compactObject<T extends Record<string, unknown>>(input: T): T | undefined {
  const output: Record<string, unknown> = {}
  let changed = false
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue
    if (value === null) {
      output[key] = value
      continue
    }
    if (typeof value === "object" && Object.keys(value as Record<string, unknown>).length === 0) {
      continue
    }
    changed = true
    output[key] = value
  }
  return changed ? (output as T) : undefined
}

function compactValue(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (typeof value === "object") {
    if (Array.isArray(value)) {
      const mapped = value
        .map(item => compactValue(item))
        .filter(item => item !== undefined)
      return mapped.length ? mapped : undefined
    }
    const mapped = compactObject(value as Record<string, unknown>)
    return mapped
  }
  return value
}

function isPlainObject(input: unknown): input is Record<string, unknown> {
  if (input === null || typeof input !== "object") return false
  const prototype = Object.getPrototypeOf(input)
  return prototype === Object.prototype || prototype === null
}

function sanitize(value: unknown, seen: WeakSet<object> = new WeakSet()): unknown {
  if (value === null) return null
  const valueType = typeof value
  if (valueType === "string" || valueType === "boolean") return value
  if (valueType === "number") return Number.isFinite(value as number) ? value : null
  if (valueType === "bigint") return String(value)
  if (value instanceof Date) return value.toISOString()
  if (value instanceof RegExp) return value.toString()
  if (Array.isArray(value)) return value.map(item => sanitize(item, seen)).filter(item => item !== undefined)
  if (value instanceof Set) {
    return Array.from(value.values()).map(item => sanitize(item, seen))
  }
  if (value instanceof Map) {
    const entries = Array.from(value.entries()).map(([key, val]) => [key, sanitize(val, seen)])
    return Object.fromEntries(entries as [string, unknown][])
  }
  if (valueType === "object") {
    if (seen.has(value as object)) {
      return undefined
    }
    seen.add(value as object)
    const output: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (typeof val === "function" || typeof val === "symbol" || typeof val === "undefined") continue
      const sanitized = sanitize(val, seen)
      if (sanitized !== undefined) {
        output[key] = sanitized
      }
    }
    seen.delete(value as object)
    return output
  }
  return undefined
}

function stripAdmin(
  input: unknown,
  allowedKeys: string[]
): Record<string, unknown> | undefined {
  if (!isPlainObject(input)) return undefined
  const picked: Record<string, unknown> = {}
  for (const key of allowedKeys) {
    if (input[key] !== undefined) {
      picked[key] = input[key]
    }
  }
  return compactObject(picked)
}

function stripTab(input: unknown): Record<string, unknown> | null {
  if (!isPlainObject(input)) return null
  const tab: Record<string, unknown> = {}
  if (input.name !== undefined) tab.name = input.name
  if (input.label !== undefined) tab.label = input.label
  if (input.description !== undefined) tab.description = input.description
  if (Array.isArray(input.fields)) {
    const fields = input.fields
      .map(item => stripField(item))
      .filter((field): field is Record<string, unknown> => field !== null)
    if (fields.length > 0) {
      tab.fields = fields
    }
  }
  return compactObject(tab) ?? null
}

function stripField(input: unknown): Record<string, unknown> | null {
  if (!isPlainObject(input)) return null
  const result: Record<string, unknown> = {}
  for (const key of FIELD_KEYS) {
    if (input[key] !== undefined) {
      result[key] = input[key]
    }
  }
  if (Array.isArray(input.fields)) {
    const fields = input.fields
      .map(item => stripField(item))
      .filter((field): field is Record<string, unknown> => field !== null)
    if (fields.length > 0) {
      result.fields = fields
    }
  }
  if (Array.isArray(input.tabs)) {
    const tabs = input.tabs
      .map(tab => stripTab(tab))
      .filter((tab): tab is Record<string, unknown> => tab !== null)
    if (tabs.length > 0) {
      result.tabs = tabs
    }
  }
  if (Array.isArray(input.blocks)) {
    const blocks = input.blocks
      .map(block => stripBlock(block))
      .filter((block): block is BlockManifest => block !== null)
    if (blocks.length > 0) {
      result.blocks = blocks
    }
  }
  if (isPlainObject(input.admin)) {
    const admin = stripAdmin(input.admin, FIELD_ADMIN_KEYS)
    if (admin) {
      result.admin = admin
    }
  }
  return compactObject(result) ?? null
}

function stripBlock(input: unknown): BlockManifest | null {
  if (!isPlainObject(input)) return null
  const block: Record<string, unknown> = {}
  if (typeof input.slug === "string") {
    block.slug = input.slug
  }
  if (input.interfaceName !== undefined) {
    block.interfaceName = input.interfaceName
  }
  if (input.labels !== undefined) {
    block.labels = input.labels
  }
  if (typeof input.imageURL === "string") {
    block.imageURL = input.imageURL
  }
  if (isPlainObject(input.admin)) {
    const admin = stripAdmin(input.admin, BLOCK_ADMIN_KEYS)
    if (admin) {
      block.admin = admin
    }
  }
  if (Array.isArray(input.fields)) {
    const fields = input.fields
      .map(item => stripField(item))
      .filter((field): field is Record<string, unknown> => field !== null)
    if (fields.length > 0) {
      block.fields = fields
    }
  }
  const compacted = compactObject(block) as BlockManifest | undefined
  return compacted ?? null
}

function stripVersions(input: Record<string, unknown>): Record<string, unknown> | undefined {
  const picked: Record<string, unknown> = {}
  for (const key of VERSION_KEYS) {
    if (input[key] !== undefined) {
      picked[key] = input[key]
    }
  }
  return compactObject(picked)
}

function stripUpload(input: Record<string, unknown>): Record<string, unknown> | undefined {
  const picked: Record<string, unknown> = {}
  for (const key of UPLOAD_KEYS) {
    if (input[key] !== undefined) {
      picked[key] = input[key]
    }
  }
  return compactObject(picked)
}

function stripAuth(input: Record<string, unknown>): Record<string, unknown> | undefined {
  const picked: Record<string, unknown> = { enabled: true }
  for (const key of AUTH_KEYS) {
    if (input[key] !== undefined) {
      picked[key] = input[key]
    }
  }
  return compactObject(picked)
}

function stripCollection(collection: unknown): CollectionManifest | null {
  if (!isPlainObject(collection) || typeof collection.slug !== "string") {
    return null
  }
  const result: Record<string, unknown> = { slug: collection.slug }
  if (collection.labels !== undefined) {
    result.labels = collection.labels
  }
  if (isPlainObject(collection.admin)) {
    const admin = stripAdmin(collection.admin, COLLECTION_ADMIN_KEYS)
    if (admin) {
      result.admin = admin
    }
  }
  if (collection.auth !== undefined) {
    if (typeof collection.auth === "boolean") {
      result.auth = collection.auth
    } else if (isPlainObject(collection.auth)) {
      const auth = stripAuth(collection.auth)
      if (auth) {
        result.auth = auth
      }
    }
  }
  if (typeof collection.timestamps === "boolean") {
    result.timestamps = collection.timestamps
  }
  if (isPlainObject(collection.versions)) {
    const versions = stripVersions(collection.versions)
    if (versions) {
      result.versions = versions
    }
  }
  if (isPlainObject(collection.upload)) {
    const upload = stripUpload(collection.upload)
    if (upload) {
      result.upload = upload
    }
  }
  if (collection.custom !== undefined) {
    const custom = compactValue(collection.custom)
    if (custom !== undefined) {
      result.custom = custom
    }
  }
  const fields = Array.isArray(collection.fields)
    ? collection.fields
        .map(item => stripField(item))
        .filter((field): field is Record<string, unknown> => field !== null)
    : []
  result.fields = fields
  const compactedCollection = compactObject(result) as CollectionManifest | undefined
  return compactedCollection ?? null
}

function stripGlobal(globalConfig: unknown): GlobalManifest | null {
  if (!isPlainObject(globalConfig) || typeof globalConfig.slug !== "string") {
    return null
  }
  const result: Record<string, unknown> = { slug: globalConfig.slug }
  if (globalConfig.label !== undefined) {
    result.label = globalConfig.label
  }
  if (isPlainObject(globalConfig.admin)) {
    const admin = stripAdmin(globalConfig.admin, GLOBAL_ADMIN_KEYS)
    if (admin) {
      result.admin = admin
    }
  }
  const fields = Array.isArray(globalConfig.fields)
    ? globalConfig.fields
        .map(item => stripField(item))
        .filter((field): field is Record<string, unknown> => field !== null)
    : []
  result.fields = fields
  if (globalConfig.custom !== undefined) {
    const custom = compactValue(globalConfig.custom)
    if (custom !== undefined) {
      result.custom = custom
    }
  }
  const compactedGlobal = compactObject(result) as GlobalManifest | undefined
  return compactedGlobal ?? null
}

function buildResponseBody(req: PayloadRequest) {
  const payload = req.payload
  const payloadConfig = payload.config ?? {}
  const collections: CollectionManifest[] = Array.isArray(payloadConfig?.collections)
    ? payloadConfig.collections
        .map((collection: unknown) => stripCollection(sanitize(collection)))
        .filter((collection): collection is CollectionManifest => collection !== null)
    : []
  const globals: GlobalManifest[] = Array.isArray(payloadConfig?.globals)
    ? payloadConfig.globals
        .map((global: unknown) => stripGlobal(sanitize(global)))
        .filter((global): global is GlobalManifest => global !== null)
    : []
  const sectionBlocks: BlockManifest[] = sections.sectionBlocks
    .map((block: unknown) => stripBlock(sanitize(block)))
    .filter((block): block is BlockManifest => block !== null)
  const payloadMeta =
    compactObject({
      localization: sanitize(payloadConfig.localization),
      csrf: sanitize(payloadConfig.csrf),
    } as Record<string, unknown>) ?? {}
  return {
    generatedAt: new Date().toISOString(),
    site: {
      id: process.env.AI_AGENT_USER_ID ?? null,
      url: process.env.NEXT_PUBLIC_URL ?? null,
    },
    payload: payloadMeta,
    collections,
    globals,
    sections: {
      blocks: sectionBlocks,
    },
  }
}

function compareBySlug(a: { slug?: string }, b: { slug?: string }) {
  const slugA = a.slug ?? ""
  const slugB = b.slug ?? ""
  return slugA.localeCompare(slugB)
}

function normalizeFields(fields: FieldManifest[]): void {
  fields.forEach(field => {
    if (Array.isArray(field.fields)) {
      normalizeFields(field.fields as FieldManifest[])
    }
    if (Array.isArray(field.blocks)) {
      const blocks = field.blocks as BlockManifest[]
      blocks.sort(compareBySlug)
      blocks.forEach(block => {
        if (Array.isArray(block.fields)) {
          normalizeFields(block.fields as FieldManifest[])
        }
      })
    }
    if (Array.isArray(field.tabs)) {
      const tabs = field.tabs as Array<Record<string, unknown>>
      tabs.forEach(tab => {
        if (Array.isArray(tab.fields)) {
          normalizeFields(tab.fields as FieldManifest[])
        }
      })
    }
  })
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_, v) => {
    if (Array.isArray(v)) {
      return v
    }
    if (v && typeof v === "object") {
      const entries = Object.entries(v as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b))
      return Object.fromEntries(entries)
    }
    return v
  })
}

function normalizeForSignature(snapshot: RegistrySnapshot) {
  const collections = cloneJson(snapshot.collections ?? [])
  collections.sort(compareBySlug)
  collections.forEach(collection => {
    if (Array.isArray(collection.fields)) {
      normalizeFields(collection.fields as FieldManifest[])
    }
  })
  const globals = cloneJson(snapshot.globals ?? [])
  globals.sort(compareBySlug)
  globals.forEach(global => {
    if (Array.isArray(global.fields)) {
      normalizeFields(global.fields as FieldManifest[])
    }
  })
  return { collections, globals }
}

function computeSchemaSignature(snapshot: RegistrySnapshot): string {
  const source = normalizeForSignature(snapshot)
  const serialized = stableStringify(source)
  return createHash("sha256").update(serialized).digest("hex").substring(0, 12)
}

async function writeDebugSnapshot(raw: string, options: RegistryDebugOptions) {
  if (!options.enabled) return
  const pretty = JSON.stringify(JSON.parse(raw), null, 2)
  const sizeInMb = Buffer.byteLength(raw) / 1024 / 1024
  await mkdir(dirname(options.targetPath), { recursive: true })
  await writeFile(options.targetPath, pretty, "utf8")
  console.log(`[ai-registry] snapshot ${sizeInMb.toFixed(2)} MB saved to ${options.targetPath}`)
}

function getSegments(param: RouteParamValue): string[] {
  if (Array.isArray(param)) return param
  if (typeof param === "string" && param.length > 0) return param.split("/")
  return []
}

async function proxyToPayload(req: PayloadRequest, targetPath: string): Promise<Response> {
  const apiKey = ensureApiKey()
  if (!apiKey) {
    req.payload.logger.error("AI Bridge plugin requires AI_AGENT_API_KEY to proxy requests")
    return Response.json({ error: "AI bridge proxy misconfigured" }, { status: 500 })
  }
  const fallbackHost = req.headers.get("host") ?? "localhost"
  const fallbackProtocol = req.headers.get("x-forwarded-proto") ?? "http"
  const baseHref = req.url ?? `${fallbackProtocol}://${fallbackHost}`
  const originalUrl = new URL(baseHref)
  const targetUrl = new URL(targetPath, `${originalUrl.protocol}//${originalUrl.host}`)
  targetUrl.search = originalUrl.search
  const headers = new Headers(req.headers)
  headers.set(AUTH_HEADER, `users API-Key ${apiKey}`)
  headers.delete("content-length")
  const method = req.method?.toUpperCase() ?? "GET"
  const init: RequestInit & { duplex?: "half" } = { method, headers }
  const requestLike = req as unknown as Request
  if (!["GET", "HEAD"].includes(method)) {
    const contentType = req.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
      const bodyText = await requestLike.text().catch(() => "")
      if (bodyText) {
        init.body = bodyText
        headers.set("content-type", contentType)
      }
    } else if (contentType.includes("multipart/form-data")) {
      init.body = requestLike.body ?? null
      if (init.body) {
        init.duplex = "half"
        headers.set("content-type", contentType)
      }
    } else {
      const buffer = await requestLike.arrayBuffer().catch(() => null)
      if (buffer) {
        init.body = buffer
        init.duplex = "half"
        if (contentType) {
          headers.set("content-type", contentType)
        }
      }
    }
  }
  const forwarded = new Request(targetUrl.toString(), init)
  return handleEndpoints({ config: req.payload.config, request: forwarded })
}

async function revalidateRegistry(payload: PayloadRequest["payload"], contextLabel: string) {
  try {
    revalidateTag(REGISTRY_TAG)
    payload.logger.info(`[ai-bridge] Revalidated ${REGISTRY_TAG} after ${contextLabel}`)
  } catch (error) {
    payload.logger.error(`[ai-bridge] Failed to revalidate ${REGISTRY_TAG} after ${contextLabel}`, error)
  }
}

const invalidateCollectionAfterChange: CollectionAfterChangeHook = async args => {
  const { req, doc, context } = args
  const payload = req.payload
  if (shouldPreventHooks(payload, context)) {
    return doc
  }
  await revalidateRegistry(payload, `collection change (${req.routeParams?.collection ?? "unknown"})`)
  return doc
}

const invalidateCollectionAfterDelete: CollectionAfterDeleteHook = async args => {
  const { req, doc, context } = args
  const payload = req.payload
  if (shouldPreventHooks(payload, context)) {
    return doc
  }
  await revalidateRegistry(payload, `collection delete (${req.routeParams?.collection ?? "unknown"})`)
  return doc
}

const invalidateGlobalAfterChange: GlobalAfterChangeHook = async args => {
  const { req, doc, context, global } = args
  const payload = req.payload
  if (shouldPreventHooks(payload, context)) {
    return doc
  }
  await revalidateRegistry(payload, `global change (${global?.slug ?? "unknown"})`)
  return doc
}

function applyCollectionHooks(collection: CollectionConfig): CollectionConfig {
  const hooks = {
    ...collection.hooks,
    afterChange: [...(collection.hooks?.afterChange ?? []), invalidateCollectionAfterChange],
    afterDelete: [...(collection.hooks?.afterDelete ?? []), invalidateCollectionAfterDelete],
  }
  return {
    ...collection,
    hooks,
  }
}

function applyGlobalHooks(globalConfig: GlobalConfig): GlobalConfig {
  const hooks = {
    ...globalConfig.hooks,
    afterChange: [...(globalConfig.hooks?.afterChange ?? []), invalidateGlobalAfterChange],
  }
  return {
    ...globalConfig,
    hooks,
  }
}

function ensureGlobals(globals: GlobalConfig[] | undefined): GlobalConfig[] {
  const list = globals ? [...globals] : []
  const hasAISettings = list.some(globalConfig => globalConfig.slug === AISettings.slug)
  if (!hasAISettings) {
    list.push(AISettings)
  }
  return list.map(applyGlobalHooks)
}

async function handleRegistry(req: PayloadRequest): Promise<Response> {
  if (!hasValidBearer(req)) {
    return unauthorized()
  }
  const snapshot = buildResponseBody(req)
  const schemaVersion = computeSchemaSignature(snapshot)
  const responseBody: Record<string, unknown> = { ...snapshot, schemaVersion }
  const raw = JSON.stringify(responseBody)
  const etag = `W/"${schemaVersion}"`
  const debugOptions = resolveDebugOptions()
  await writeDebugSnapshot(raw, debugOptions)
  const ifNoneMatch = req.headers.get("if-none-match")
  if (ifNoneMatch && ifNoneMatch === etag) {
    return new Response(null, {
      status: 304,
      headers: {
        ETag: etag,
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    })
  }
  return new Response(raw, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      ETag: etag,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  })
}

async function handleRestProxy(req: PayloadRequest): Promise<Response> {
  if (!hasValidBearer(req)) {
    return unauthorized()
  }
  const segments = getSegments(req.routeParams?.segments as RouteParamValue)
  if (segments.length === 0) {
    return Response.json({ error: "Missing REST target" }, { status: 400 })
  }
  const targetPath = `/api/${segments.join("/")}`
  return proxyToPayload(req, targetPath)
}

async function handleCollectionProxy(req: PayloadRequest): Promise<Response> {
  if (!hasValidBearer(req)) {
    return unauthorized()
  }
  const slug = typeof req.routeParams?.slug === "string" ? req.routeParams?.slug : null
  if (!slug) {
    return Response.json({ error: "Collection slug missing" }, { status: 400 })
  }
  const idSegment = typeof req.routeParams?.id === "string" ? req.routeParams?.id : null
  const targetPath = idSegment ? `/api/${slug}/${idSegment}` : `/api/${slug}`
  return proxyToPayload(req, targetPath)
}

async function handleGlobalProxy(req: PayloadRequest): Promise<Response> {
  if (!hasValidBearer(req)) {
    return unauthorized()
  }
  const slug = typeof req.routeParams?.slug === "string" ? req.routeParams?.slug : null
  if (!slug) {
    return Response.json({ error: "Global slug missing" }, { status: 400 })
  }
  const targetPath = `/api/globals/${slug}`
  return proxyToPayload(req, targetPath)
}

function registerEndpoints(endpoints: unknown): EndpointConfig[] {
  const list = Array.isArray(endpoints) ? [...(endpoints as EndpointConfig[])] : []
  list.push({ path: REGISTRY_ENDPOINT, method: "get", handler: handleRegistry })
  const restMethods: EndpointConfig["method"][] = ["get", "post", "patch", "put", "delete"]
  restMethods.forEach(method => {
    list.push({ path: `${REST_ENDPOINT}/:segments*`, method, handler: handleRestProxy })
  })
  const collectionMethods: EndpointConfig["method"][] = ["get", "post"]
  collectionMethods.forEach(method => {
    list.push({ path: `${COLLECTION_ENDPOINT}/:slug`, method, handler: handleCollectionProxy })
  })
  const collectionDetailMethods: EndpointConfig["method"][] = ["get", "patch", "delete"]
  collectionDetailMethods.forEach(method => {
    list.push({ path: `${COLLECTION_ENDPOINT}/:slug/:id`, method, handler: handleCollectionProxy })
  })
  const globalMethods: EndpointConfig["method"][] = ["get", "post", "patch"]
  globalMethods.forEach(method => {
    list.push({ path: `${GLOBAL_ENDPOINT}/:slug`, method, handler: handleGlobalProxy })
  })
  return list
}

export const aiBridgePlugin: Plugin = incomingConfig => {
  const collections = (incomingConfig.collections ?? []).map(applyCollectionHooks)
  const globals = ensureGlobals(incomingConfig.globals)
  const endpoints = registerEndpoints(incomingConfig.endpoints)

  return {
    ...incomingConfig,
    collections,
    globals,
    endpoints: endpoints as any,
  }
}

export default aiBridgePlugin
