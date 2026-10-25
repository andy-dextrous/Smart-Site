import type { Field, PayloadRequest } from "payload"
import { APIError } from "payload"
import { contentTarget } from "./contracts"

// Payload hooks can populate fields after access filtering. Never serialize their
// arbitrary additions, even at depth zero. Relationships leave this boundary as IDs.
export async function projectFields(
  req: PayloadRequest,
  fields: Field[],
  value: any,
  root = value
): Promise<any> {
  if (!value || typeof value !== "object") return value
  const out: Record<string, unknown> = {}
  for (const key of ["id", "createdAt", "updatedAt", "_status"])
    if (["string", "number"].includes(typeof value[key])) out[key] = value[key]
  for (const field of fields) {
    if (field.type === "ui") continue
    if (field.type === "tabs") {
      for (const tab of field.tabs) {
        if ("name" in tab) {
          if (value[tab.name] !== undefined)
            out[tab.name] = await projectFields(req, tab.fields, value[tab.name], root)
        } else Object.assign(out, await projectFields(req, tab.fields, value, root))
      }
      continue
    }
    if (!("name" in field)) {
      if ("fields" in field)
        Object.assign(out, await projectFields(req, field.fields, value, root))
      continue
    }
    if (!(field.name in value)) continue
    if (
      field.access?.read &&
      !(await field.access.read({
        req,
        doc: root,
        data: root,
        siblingData: value,
        id: root?.id,
      }))
    )
      continue
    const child = value[field.name]
    if (field.type === "relationship" || field.type === "upload") {
      const reference = (v: any): unknown => {
        if (v == null || typeof v === "string" || typeof v === "number") return v
        if ("relationTo" in v)
          return {
            relationTo: v.relationTo,
            value: typeof v.value === "object" ? v.value?.id : v.value,
          }
        return v.id
      }
      out[field.name] = Array.isArray(child) ? child.map(reference) : reference(child)
    } else if (field.type === "blocks") {
      out[field.name] = await Promise.all(
        (Array.isArray(child) ? child : []).map(async row => {
          const block = field.blocks.find(
            b => typeof b !== "string" && b.slug === row.blockType
          )
          if (!block || typeof block === "string")
            return { id: row.id, blockType: row.blockType }
          return {
            ...(await projectFields(req, block.fields, row, root)),
            blockType: block.slug,
            ...(typeof row.blockName === "string" ? { blockName: row.blockName } : {}),
          }
        })
      )
    } else if ("fields" in field) {
      out[field.name] = Array.isArray(child)
        ? await Promise.all(child.map(row => projectFields(req, field.fields, row, root)))
        : await projectFields(req, field.fields, child, root)
    } else if (field.type === "richText")
      out[field.name] = await projectLexical(req, field, child, root)
    else out[field.name] = child
  }
  return out
}
export function lexicalBlockFields(
  req: PayloadRequest,
  field: Field,
  node: any
): Field[] {
  const editor = (field as any).editor
  const feature = editor?.editorConfig?.resolvedFeatureMap?.get("blocks")
  const schemaMap = feature?.generateSchemaMap?.({
    config: req.payload.config,
    field,
    i18n: req.i18n,
    schemaMap: new Map(),
    schemaPath: "",
    props: feature.sanitizedServerFeatureProps,
  })
  const prefix = node.type === "block" ? "lexical_blocks" : "lexical_inline_blocks"
  const schema = schemaMap?.get(`${prefix}.${node.fields.blockType}.fields`)
  if (!schema?.fields)
    throw new APIError(
      "Rich-text block schema is unavailable; inspect this field in the CMS before editing.",
      422
    )
  return schema.fields
}
async function projectLexical(
  req: PayloadRequest,
  field: Field,
  value: any,
  root: any
): Promise<any> {
  if (Array.isArray(value))
    return Promise.all(value.map(v => projectLexical(req, field, v, root)))
  if (!value || typeof value !== "object") return value
  const out: any = {}
  for (const key of [
    "root",
    "children",
    "type",
    "version",
    "text",
    "format",
    "detail",
    "mode",
    "style",
    "direction",
    "indent",
    "tag",
    "listType",
    "start",
    "value",
    "checked",
    "url",
    "newTab",
    "linkType",
    "relationTo",
    "id",
  ]) {
    if (value[key] !== undefined)
      out[key] =
        key === "value" && typeof value[key] === "object"
          ? value[key]?.id
          : await projectLexical(req, field, value[key], root)
  }
  if (value.fields) {
    if (["block", "inlineBlock"].includes(value.type)) {
      const fields = lexicalBlockFields(req, field, value)
      out.fields = {
        ...(await projectFields(req, fields, value.fields, root)),
        blockType: value.fields.blockType,
      }
    } else out.fields = await projectLexical(req, field, value.fields, root)
  }
  if (value.doc)
    out.doc = {
      relationTo: value.doc.relationTo,
      value: typeof value.doc.value === "object" ? value.doc.value?.id : value.doc.value,
    }
  return out
}
export async function projectContentResponse(
  req: PayloadRequest,
  target: string,
  value: unknown
) {
  const config =
    contentTarget(target) === "global"
      ? req.payload.config.globals.find(g => g.slug === target)
      : req.payload.collections[target as keyof typeof req.payload.collections]?.config
  if (!config) throw new APIError("Content target unavailable", 404)
  return projectFields(req, config.fields, value)
}
