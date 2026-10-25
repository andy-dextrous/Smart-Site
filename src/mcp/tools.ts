import { createHash } from "node:crypto"
import { APIError } from "payload"
import type { CollectionSlug, GlobalSlug, PayloadRequest, Field, Where } from "payload"
import { z } from "zod"
import sharp from "sharp"
import { projectContentResponse } from "@/mcp/projection"
import { withOperation, operationStatus, operationKey } from "@/mcp/operations"
import { revalidate, revalidateGlobal } from "@/website/cache"
import type { MCPPluginConfig } from "@payloadcms/plugin-mcp"
import { userHasMinimumRole } from "@/access/roles"
import {
  catalogue,
  contentTarget,
  revision,
  checkRevision,
  validatePatch,
} from "@/mcp/contracts"

// These three operations accept runtime-discovered content schemas. Payload owns
// their validation; keep this dynamic boundary separate from typed read operations.
interface ContentWriteOptions {
  data: Record<string, unknown>
  depth: number
  overrideAccess: false
  req: PayloadRequest
  draft: boolean
}
interface ContentWriter {
  updateGlobal(options: ContentWriteOptions & { slug: GlobalSlug }): Promise<unknown>
  create(
    options: ContentWriteOptions & { collection: CollectionSlug }
  ): Promise<{ id: string }>
  update(
    options: ContentWriteOptions & {
      collection: CollectionSlug
      id: string
      overrideLock: false
    }
  ): Promise<unknown>
}

const targetSchema = z.string().min(1).max(100)
const json = (value: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(value) }],
})
function editor(req: PayloadRequest) {
  if (!userHasMinimumRole(req.user, "editor"))
    throw new APIError("A website editor account is required.", 403)
}
function configFor(req: PayloadRequest, target: string) {
  return contentTarget(target, req.payload.config) === "global"
    ? req.payload.config.globals.find(config => config.slug === target)!
    : req.payload.collections[target as CollectionSlug]?.config
}
async function read(req: PayloadRequest, target: string, id?: string, draft = true) {
  if (contentTarget(target, req.payload.config) === "global")
    return req.payload.findGlobal({
      slug: target as GlobalSlug,
      depth: 0,
      draft,
      overrideAccess: false,
      req,
    })
  if (!id) throw new APIError("A document ID is required.", 400)
  return req.payload.findByID({
    collection: target as CollectionSlug,
    id,
    depth: 0,
    draft,
    overrideAccess: false,
    req,
  })
}
function fieldsAt(fields: Field[], path: string[]): Field[] {
  if (!path.length) return fields
  for (const field of fields) {
    if ("name" in field && field.name === path[0]) {
      if (path.length === 1) return [field]
      if ("fields" in field) return fieldsAt(field.fields, path.slice(1))
    }
    if (field.type === "tabs")
      for (const tab of field.tabs) {
        if ("name" in tab && tab.name === path[0]) {
          return path.length === 1 ? tab.fields : fieldsAt(tab.fields, path.slice(1))
        }
        if (!("name" in tab)) {
          const found = fieldsAt(tab.fields, path)
          if (found.length) return found
        }
      }
    if (!("name" in field) && "fields" in field) {
      const found = fieldsAt(field.fields, path)
      if (found.length) return found
    }
  }
  return []
}
async function filterSchemaFields(
  req: PayloadRequest,
  fields: Field[]
): Promise<Field[]> {
  const output: Field[] = []
  for (const field of fields) {
    try {
      if (
        "access" in field &&
        field.access?.read &&
        !(await field.access.read({ req, data: {}, siblingData: {} }))
      )
        continue
    } catch {
      continue
    }
    const copy: any = { ...field }
    if ("fields" in field) copy.fields = await filterSchemaFields(req, field.fields)
    if (field.type === "tabs")
      copy.tabs = await Promise.all(
        field.tabs.map(async tab => ({
          ...tab,
          fields: await filterSchemaFields(req, tab.fields),
        }))
      )
    if (field.type === "blocks")
      copy.blocks = await Promise.all(
        field.blocks.map(async block =>
          typeof block === "string"
            ? block
            : { ...block, fields: await filterSchemaFields(req, block.fields) }
        )
      )
    output.push(copy)
  }
  return output
}
async function readableTarget(req: PayloadRequest, target: string) {
  const config = configFor(req, target)
  if (!config || ("auth" in config && config.auth)) return false
  try {
    return config.access?.read ? (await config.access.read({ req })) !== false : true
  } catch {
    return false
  }
}
export async function describe(
  req: PayloadRequest,
  fields: Field[],
  expanded: boolean
): Promise<unknown[]> {
  const visible: Field[] = []
  for (const field of fields) {
    try {
      if (
        "access" in field &&
        field.access?.read &&
        !(await field.access.read({ req, data: {}, siblingData: {} }))
      )
        continue
    } catch {
      continue
    }
    visible.push(field)
  }
  return Promise.all(
    visible
      .filter(field => field.type !== "ui")
      .map(async field => {
        const result: Record<string, unknown> = { type: field.type }
        for (const key of [
          "name",
          "label",
          "required",
          "defaultValue",
          "minRows",
          "maxRows",
          "relationTo",
          "hasMany",
          "options",
        ]) {
          if (key in field && typeof field[key as keyof Field] !== "function")
            result[key] = field[key as keyof Field]
        }
        if (
          field.admin &&
          "description" in field.admin &&
          typeof field.admin.description !== "function"
        )
          result.description = field.admin.description
        if ("fields" in field) result.fields = await describe(req, field.fields, expanded)
        if (field.type === "tabs")
          result.tabs = await Promise.all(
            field.tabs.map(async tab => ({
              name: "name" in tab ? tab.name : undefined,
              label: tab.label,
              fields: await describe(req, tab.fields, expanded),
            }))
          )
        if (field.type === "blocks")
          result.blocks = await Promise.all(
            field.blocks.map(async block =>
              typeof block === "string"
                ? block
                : {
                    slug: block.slug,
                    labels: block.labels,
                    ...(expanded
                      ? { fields: await describe(req, block.fields, false) }
                      : {}),
                  }
            )
          )
        return result
      })
  )
}
export async function contentRead(args: Record<string, unknown>, req: PayloadRequest) {
  editor(req)
  const action = args.action as string
  if (action === "catalogue") {
    const allowed = catalogue(req.payload.config)
    const filter = async (slugs: readonly string[]) =>
      (
        await Promise.all(
          slugs.map(async slug => {
            try {
              contentTarget(slug, req.payload.config)
              return (await readableTarget(req, slug)) ? slug : null
            } catch {
              return null
            }
          })
        )
      ).filter(Boolean)
    return json({
      collections: await filter(allowed.collections),
      globals: await filter(allowed.globals),
      siteId: process.env.SMARTSITE_SITE_ID,
      environment: process.env.SMARTSITE_ENVIRONMENT || "unconfigured",
      notes:
        "Read schema and current content before writing. Updates require the current revision. Arrays replace the whole array; preserve IDs. Non-draft saves are live immediately.",
    })
  }
  const target = args.target as string
  const config = configFor(req, target)
  if (!config || ("auth" in config && config.auth))
    throw new APIError("Content target unavailable", 403)
  if (!config) throw new APIError("Content target is not available.", 404)
  const id = args.id as string | undefined
  if (action === "schema") {
    if (!(await readableTarget(req, target)))
      throw new APIError("Content target unavailable", 403)
    const accessibleFields = await filterSchemaFields(req, config.fields)
    let fields = fieldsAt(
      accessibleFields,
      ((args.field as string) || "").split(".").filter(Boolean)
    )
    if (args.block) {
      const blockField = fields.find(field => field.type === "blocks")
      const block =
        blockField?.type === "blocks"
          ? blockField.blocks.find(
              block => typeof block !== "string" && block.slug === args.block
            )
          : undefined
      if (!block || typeof block === "string")
        throw new APIError("Choose a block listed in this field's schema.", 404)
      fields = block.fields
    }
    if (!fields.length) throw new APIError("Field not found.", 404)
    return json({
      target,
      drafts: Boolean(config.versions && config.versions.drafts),
      versions: Boolean(config.versions),
      fields: await describe(req, fields, Boolean(args.field || args.block)),
    })
  }
  if (action === "get") {
    const doc = await read(req, target, id)
    return json({
      document: await projectContentResponse(req, target, doc),
      revision: revision(doc),
    })
  }
  if (action === "find") {
    if (contentTarget(target, req.payload.config) !== "collection")
      throw new APIError("Use get for a global.", 400)
    const result = await req.payload.find({
      collection: target as CollectionSlug,
      req,
      overrideAccess: false,
      depth: 0,
      draft: true,
      limit: (args.limit as number) ?? 10,
      page: (args.page as number) ?? 1,
      where: (args.where as Where) ?? {},
    })
    return json({
      totalDocs: result.totalDocs,
      hasNextPage: result.hasNextPage,
      docs: await Promise.all(
        result.docs.map(async doc => ({
          document: await projectContentResponse(req, target, doc),
          revision: revision(doc),
        }))
      ),
    })
  }
  if (!config.versions) throw new APIError("History is unavailable for this target.", 400)
  if (action === "version") {
    const versionId = args.versionId as string
    if (!versionId) throw new APIError("A version ID is required.", 400)
    const version =
      contentTarget(target, req.payload.config) === "global"
        ? await req.payload.findGlobalVersionByID({
            slug: target as GlobalSlug,
            id: versionId,
            depth: 0,
            overrideAccess: false,
            req,
          })
        : await req.payload.findVersionByID({
            collection: target as CollectionSlug,
            id: versionId,
            depth: 0,
            overrideAccess: false,
            req,
          })
    if (
      contentTarget(target, req.payload.config) === "collection" &&
      String(version.parent) !== id
    )
      throw new APIError("This version belongs to another document.", 400)
    return json({
      id: version.id,
      version: await projectContentResponse(req, target, version.version),
    })
  }
  if (contentTarget(target, req.payload.config) === "collection" && !id)
    throw new APIError("A document ID is required.", 400)
  const result =
    contentTarget(target, req.payload.config) === "global"
      ? await req.payload.findGlobalVersions({
          slug: target as GlobalSlug,
          limit: 10,
          sort: "-updatedAt",
          depth: 0,
          overrideAccess: false,
          req,
        })
      : await req.payload.findVersions({
          collection: target as CollectionSlug,
          where: { parent: { equals: id } },
          limit: 10,
          sort: "-updatedAt",
          depth: 0,
          overrideAccess: false,
          req,
        })
  return json({
    totalDocs: result.totalDocs,
    versions: result.docs.map(doc => ({
      id: doc.id,
      updatedAt: doc.updatedAt,
    })),
  })
}

export async function contentSave(args: Record<string, unknown>, req: PayloadRequest) {
  editor(req)
  const target = args.target as string
  const kind = contentTarget(target, req.payload.config)
  const config = configFor(req, target)
  if (!config || ("auth" in config && config.auth))
    throw new APIError("Content target unavailable", 403)
  if (!config) throw new APIError("Content target unavailable.", 404)
  const data = args.data as Record<string, unknown>
  validatePatch(data)
  const hasDrafts = Boolean(config.versions && config.versions.drafts)
  const mode = args.mode as string
  if ((hasDrafts && mode === "live") || (!hasDrafts && mode !== "live"))
    throw new APIError(
      hasDrafts
        ? "Choose draft, publish or unpublish."
        : "This content saves live; choose live explicitly.",
      400
    )
  const creating = args.action === "create"
  if (creating && mode === "unpublish")
    throw new APIError("Only existing content can be unpublished.", 400)
  if (creating && (kind === "global" || target === "media"))
    throw new APIError("Update globals; use smartsiteUploadMedia for new media.", 400)
  if (!creating && kind === "collection" && !args.id)
    throw new APIError("A document ID is required.", 400)
  const transactionID = req.transactionID
  if (!transactionID)
    throw new APIError("Checked content writes require database transactions.", 503)
  const searchParams = new URLSearchParams(req.searchParams)
  searchParams.set("draft", String(mode === "draft"))
  const txReq = {
    ...req,
    context: { ...req.context },
    query: { ...req.query, draft: mode === "draft" },
    searchParams,
    transactionID,
  } as PayloadRequest
  let previousDoc: any
  let previousPublicDoc: any
  try {
    if (!creating) {
      previousDoc = await read(txReq, target, args.id as string)
      checkRevision(previousDoc, args.expectedRevision as string)
      previousPublicDoc = hasDrafts
        ? await read(txReq, target, args.id as string, false)
        : previousDoc
    }
    const patch = {
      ...data,
      ...(hasDrafts ? { _status: mode === "publish" ? "published" : "draft" } : {}),
    }
    const writer = req.payload as unknown as ContentWriter
    const common: ContentWriteOptions = {
      data: patch,
      depth: 0,
      overrideAccess: false,
      req: txReq,
      draft: mode === "draft",
    }
    if (kind === "global")
      await writer.updateGlobal({ ...common, slug: target as GlobalSlug })
    else if (creating) {
      const doc = await writer.create({
        ...common,
        collection: target as CollectionSlug,
      })
      args = { ...args, id: doc.id }
    } else
      await writer.update({
        ...common,
        collection: target as CollectionSlug,
        id: args.id as string,
        overrideLock: false,
      })
    // The operation wrapper commits the content and receipt together.
  } catch (error) {
    throw error
  }
  const doc = await read(req, target, args.id as string)
  const refreshes = req.context.smartsiteAfterCommit as Array<() => Promise<unknown>>
  if (kind === "global")
    refreshes.push(() => revalidateGlobal(target, doc, previousDoc, req.payload.logger))
  else if (mode !== "draft")
    refreshes.push(() =>
      revalidate({
        collection: target,
        doc,
        previousDoc: previousPublicDoc,
        action: creating ? "create" : "update",
        logger: req.payload.logger,
      })
    )
  return json({
    document: await projectContentResponse(req, target, doc),
    revision: revision(doc),
    mode,
    committed: true,
    note:
      mode === "draft"
        ? "Draft saved. Public content is unchanged."
        : mode === "unpublish"
          ? "Unpublished. Verify the public URL no longer serves this content."
          : "Saved live. Verify the public page and links.",
  })
}

export async function uploadMedia(args: Record<string, unknown>, req: PayloadRequest) {
  editor(req)
  const encoded = args.base64 as string
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded))
    throw new APIError("Provide plain base64 image bytes.", 400)
  const bytes = Buffer.from(encoded, "base64")
  if (!bytes.length || bytes.length > 2 * 1024 * 1024)
    throw new APIError("Images must be at most 2 MiB; resize first.", 400)
  const metadata = await sharp(bytes, { limitInputPixels: 40_000_000 }).metadata()
  if (!["png", "jpeg", "webp"].includes(metadata.format ?? ""))
    throw new APIError("Upload a PNG, JPEG or WebP image.", 400)
  const digest = createHash("sha256").update(bytes).digest("hex")
  const name = `website-${digest}.${metadata.format === "jpeg" ? "jpg" : metadata.format}`
  // Reserve before any filesystem/object-storage effect. A failed transaction
  // leaves a durable pending record; retries stop for explicit reconciliation.
  const outside = { ...req, transactionID: undefined } as PayloadRequest
  const existing = await req.payload.find({
    collection: "smartsite-uploads" as any,
    where: { digest: { equals: digest } },
    limit: 1,
    pagination: false,
    overrideAccess: true,
    req: outside,
  })
  const reservation = existing.docs[0] as any
  if (reservation?.state === "committed") {
    const media = await req.payload.findByID({
      collection: "media",
      id: reservation.mediaId,
      depth: 0,
      overrideAccess: false,
      req,
    })
    return json({
      document: await projectContentResponse(req, "media", media),
      revision: revision(media),
      reused: true,
    })
  }
  if (reservation)
    throw new APIError(
      "This image has an unfinished storage write. Reconcile its reservation before retrying.",
      409
    )
  const pending = await req.payload.create({
    collection: "smartsite-uploads" as any,
    data: { digest, operationKey: operationKey(req, args.operationId), state: "pending" },
    overrideAccess: true,
    req: outside,
  })
  const doc = await req.payload.create({
    collection: "media",
    data: { alt: args.alt as string },
    depth: 0,
    overrideAccess: false,
    req,
    file: { data: bytes, mimetype: `image/${metadata.format}`, name, size: bytes.length },
  })
  await req.payload.update({
    collection: "smartsite-uploads" as any,
    id: pending.id,
    data: { state: "committed", mediaId: doc.id },
    overrideAccess: true,
    req,
  })
  return json({
    document: await projectContentResponse(req, "media", doc),
    revision: revision(doc),
    reused: false,
  })
}

export const smartsiteTools: NonNullable<NonNullable<MCPPluginConfig["mcp"]>["tools"]> = [
  {
    name: "smartsiteOperationStatus",
    description:
      "Reconcile a timed-out save or upload using its operationId before retrying. Returns only this key’s receipt. Unknown means no committed receipt was found; retry only the identical operation.",
    parameters: { operationId: z.string().uuid() },
    handler: operationStatus,
  },
  {
    name: "smartsiteRead",
    description:
      "Discover SmartSite website content, inspect one field/block schema, find/read documents and globals, or inspect history. Start with catalogue. Get returns the latest draft plus expectedRevision for a checked save; it is not proof of public publication. Read only the target needed. Use schema field and block to inspect page sections progressively. History lists version IDs; version returns previous content for a deliberate recovery. Accounts, submissions, learner data and infrastructure are excluded.",
    parameters: {
      action: z.enum(["catalogue", "schema", "find", "get", "history", "version"]),
      target: targetSchema.optional(),
      id: z.string().optional(),
      field: z.string().optional(),
      block: z.string().optional(),
      where: z.record(z.string(), z.unknown()).optional(),
      limit: z.number().int().min(1).max(25).optional(),
      page: z.number().int().min(1).optional(),
      versionId: z.string().optional(),
    },
    handler: contentRead,
  },
  {
    name: "smartsiteSave",
    description:
      "Create or update one website content item using normal Payload validation and access checks. Read schema and current content first. Update requires expectedRevision from get; conflicts require rereading and reconciling, never blind retries. Supply only changed fields; arrays replace entire arrays, so preserve unaffected rows and IDs. Choose draft/publish/unpublish for draft-capable documents, or live for globals/non-draft content (immediate public change). No bulk writes or deletion. To recover, read history/version and deliberately save selected previous fields against the CURRENT revision. This tool does not send form submissions or deploy code.",
    parameters: {
      operationId: z.string().uuid(),
      action: z.enum(["create", "update"]),
      target: targetSchema,
      id: z.string().optional(),
      data: z.record(z.string(), z.unknown()),
      expectedRevision: z.string().optional(),
      mode: z.enum(["draft", "publish", "unpublish", "live"]),
    },
    handler: (args, req) => withOperation(args, req, contentSave),
  },
  {
    name: "smartsiteUploadMedia",
    description:
      "Upload a new PNG, JPEG or WebP (up to 2 MiB) through the existing configured Payload storage. Supply base64 bytes and meaningful alt text; never a server path, remote URL or storage credential. Identical bytes reuse the previous upload without changing its alt text. Save the returned media ID in the intended content field. Existing media are never replaced or deleted. Larger files and other formats use the CMS upload interface.",
    parameters: {
      operationId: z.string().uuid(),
      base64: z.string().min(1).max(2_800_000),
      alt: z.string().min(1).max(1000),
    },
    handler: (args, req) => withOperation({ ...args, target: "media" }, req, uploadMedia),
  },
]
