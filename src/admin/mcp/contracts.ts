import { getSmartSiteConfig } from "@/admin/config"
import { createHash } from "node:crypto"
import { APIError, type Field } from "payload"

export const contentCollections = [
  "pages",
  "posts",
  "services",
  "team",
  "testimonials",
  "templates",
  "categories",
  "media",
  "forms",
  "redirects",
] as const
export const contentGlobals = ["header", "footer", "settings"] as const
export const contentTargets = [...contentCollections, ...contentGlobals] as const

export function catalogue() {
  const options = getSmartSiteConfig().mcp
  return {
    collections: [...contentCollections, ...options.collections],
    globals: [...contentGlobals, ...options.globals],
  }
}
export function contentTarget(target: string) {
  const allowed = catalogue()
  if (
    !getSmartSiteConfig().mcp.enabled ||
    ![...allowed.collections, ...allowed.globals].includes(target) ||
    [
      "users",
      "payload-mcp-api-keys",
      "smartsite-identity",
      "smartsite-operations",
      "form-submissions",
      "uri-index",
      "search",
    ].includes(target) ||
    target?.startsWith("payload-") ||
    target?.startsWith("smartsite-")
  )
    throw new APIError("This is not an editable website content target.", 403)
  return allowed.globals.includes(target) ? "global" : "collection"
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable)
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, stable(child)])
    )
  }
  return value
}
export function revision(doc: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(stable(doc)))
    .digest("hex")
}
export function checkRevision(doc: unknown, expected: string | undefined) {
  if (!expected || revision(doc) !== expected)
    throw new APIError(
      "Content changed or revision missing. Read it again and reconcile your edit.",
      409
    )
}
export function validatePatch(data: Record<string, unknown>) {
  const reserved = [
    "id",
    "createdAt",
    "updatedAt",
    "deletedAt",
    "globalType",
    "_status",
    "contentEditor",
    "contentEditSource",
  ]
  if (Object.keys(data).some(key => reserved.includes(key)))
    throw new APIError(
      "Do not supply system fields; choose publication mode separately.",
      400
    )
  const walk = (value: unknown) => {
    if (!value || typeof value !== "object") return
    for (const [key, child] of Object.entries(value)) {
      if (["__proto__", "constructor", "prototype"].includes(key))
        throw new APIError("Invalid content field.", 400)
      walk(child)
    }
  }
  walk(data)
  if (!Object.keys(data).length) throw new APIError("Provide the fields to change.", 400)
}

export function optInContentTools(fields: Field[]): Field[] {
  return fields.map(field => {
    if (!("fields" in field)) return field
    if ("name" in field && field.name === "payload-mcp-tool") {
      return {
        ...field,
        fields: field.fields.map(tool =>
          tool.type === "checkbox" ? { ...tool, defaultValue: false } : tool
        ),
      }
    }
    return { ...field, fields: optInContentTools(field.fields) }
  })
}
