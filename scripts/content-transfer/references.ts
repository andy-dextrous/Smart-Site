import { lexicalBlockFields } from "../../src/payload/mcp/projection"
import type { Field, PayloadRequest } from "payload"
export type Reference = { target: string; id: string; path: string; required: boolean }
export async function mapReferences(
  fields: Field[],
  value: any,
  visit: (ref: Reference) => Promise<any>,
  prefix = "",
  req?: PayloadRequest
): Promise<any> {
  if (!value || typeof value !== "object") return value
  const out = structuredClone(value)
  for (const field of fields) {
    if (field.type === "tabs") {
      for (const tab of field.tabs) {
        if ("name" in tab)
          out[tab.name] = await mapReferences(
            tab.fields,
            out[tab.name],
            visit,
            `${prefix}${tab.name}.`,
            req
          )
        else Object.assign(out, await mapReferences(tab.fields, out, visit, prefix, req))
      }
      continue
    }
    if (!("name" in field)) {
      if ("fields" in field)
        Object.assign(out, await mapReferences(field.fields, out, visit, prefix, req))
      continue
    }
    const name = field.name,
      child = out[name],
      path = `${prefix}${name}`
    if (child == null) continue
    if (field.type === "relationship" || field.type === "upload") {
      const rewrite = async (ref: any) => {
        const poly = Array.isArray(field.relationTo)
        const target = poly ? ref.relationTo : field.relationTo
        const raw = poly ? ref.value : ref
        const id = typeof raw === "object" ? raw.id : raw
        const mapped = await visit({
          target,
          id: String(id),
          path,
          required: Boolean(field.required),
        })
        return mapped == null
          ? null
          : poly
            ? { relationTo: target, value: mapped }
            : mapped
      }
      out[name] = Array.isArray(child)
        ? (await Promise.all(child.map(rewrite))).filter(x => x != null)
        : await rewrite(child)
    } else if (field.type === "blocks") {
      out[name] = await Promise.all(
        child.map(async (row: any, index: number) => {
          const block = field.blocks.find(
            b => typeof b !== "string" && b.slug === row.blockType
          )
          if (!block || typeof block === "string")
            throw new Error(`Unknown block at ${path}`)
          return mapReferences(block.fields, row, visit, `${path}[${index}].`, req)
        })
      )
    } else if ("fields" in field)
      out[name] = Array.isArray(child)
        ? await Promise.all(
            child.map((row: any, index: number) =>
              mapReferences(field.fields, row, visit, `${path}[${index}].`, req)
            )
          )
        : await mapReferences(field.fields, child, visit, `${path}.`, req)
    else if (field.type === "richText")
      out[name] = await mapLexical(child, visit, path, field, req)
  }
  return out
}
async function mapLexical(
  value: any,
  visit: (ref: Reference) => Promise<any>,
  path: string,
  field: Field,
  req?: PayloadRequest
): Promise<any> {
  if (Array.isArray(value))
    return Promise.all(
      value.map((v, i) => mapLexical(v, visit, `${path}[${i}]`, field, req))
    )
  if (!value || typeof value !== "object") return value
  const out: any = { ...value }
  if (value.relationTo && value.value != null) {
    const raw = typeof value.value === "object" ? value.value.id : value.value
    out.value = await visit({
      target: value.relationTo,
      id: String(raw),
      path,
      required: true,
    })
  }
  if (["block", "inlineBlock"].includes(value.type)) {
    if (!req)
      throw new Error(
        "Rich-text block transfer requires the current sanitized Payload schema"
      )
    out.fields = await mapReferences(
      lexicalBlockFields(req, field, value),
      value.fields,
      visit,
      `${path}.fields.`,
      req
    )
  }
  for (const key of ["root", "children", "fields", "doc"])
    if (
      value[key] &&
      !(key === "fields" && ["block", "inlineBlock"].includes(value.type))
    )
      out[key] = await mapLexical(value[key], visit, `${path}.${key}`, field, req)
  return out
}
export function schemaShape(fields: Field[], req?: PayloadRequest): unknown {
  return fields
    .filter(f => f.type !== "ui")
    .map((f: any) => ({
      name: f.name,
      type: f.type,
      required: f.required,
      relationTo: f.relationTo,
      hasMany: f.hasMany,
      options: f.options,
      fields: f.fields ? schemaShape(f.fields, req) : undefined,
      tabs: f.tabs?.map((t: any) => ({
        name: t.name,
        fields: schemaShape(t.fields, req),
      })),
      blocks: f.blocks?.map((b: any) =>
        typeof b === "string" ? b : { slug: b.slug, fields: schemaShape(b.fields, req) }
      ),
      lexical:
        f.type === "richText" && req
          ? [...(f.editor?.editorConfig?.resolvedFeatureMap ?? new Map()).entries()].map(
              ([name, feature]: any) => {
                const map = feature.generateSchemaMap?.({
                  config: req.payload.config,
                  field: f,
                  i18n: req.i18n,
                  schemaMap: new Map(),
                  schemaPath: "",
                  props: feature.sanitizedServerFeatureProps,
                })
                return {
                  name,
                  fields: map
                    ? [...map.entries()]
                        .filter(([, value]: any) => value.fields)
                        .map(([key, value]: any) => ({
                          key,
                          fields: schemaShape(value.fields, req),
                        }))
                    : undefined,
                }
              }
            )
          : undefined,
    }))
}
