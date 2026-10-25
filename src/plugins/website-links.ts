import type { Field, Plugin, CollectionSlug } from "payload"
import { websiteCollections } from "@/website/collection-metadata"

/** Resolves only the shared link helper's explicit marker; never rewrites permissions
 * or arbitrary relationships. Register Lexical blocks in config.blocks by slug so
 * these fields are available before editor sanitization.
 */
// Payload reuses imported field definitions across builds. Clone only plain schema
// containers; keep callbacks and non-plain adapter/editor instances intact.
function cloneSchema<T>(value: T, seen = new WeakMap<object, unknown>()): T {
  if (!value || typeof value !== "object") return value
  if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype)
    return value
  if (seen.has(value)) return seen.get(value) as T
  const copy: any = Array.isArray(value) ? [] : {}
  seen.set(value, copy)
  for (const [key, item] of Object.entries(value)) copy[key] = cloneSchema(item, seen)
  return copy
}

export const websiteLinksPlugin: Plugin = original => {
  const config = cloneSchema(original)
  const slugs = websiteCollections(config).map(item => item.slug as CollectionSlug)
  const visited = new WeakSet<object>()
  const walk = (fields: Field[]) => {
    for (const field of fields) {
      if (visited.has(field)) continue
      visited.add(field)
      if (
        field.type === "relationship" &&
        field.custom?.smartsiteWebsiteLink === true &&
        Array.isArray(field.relationTo) &&
        (field.relationTo as string[]).includes("__smartsite_website_link__")
      ) {
        if (!slugs.length)
          throw new Error(
            "Website links require at least one collection with custom.smartsite.route"
          )
        field.relationTo = [...slugs]
      }
      if ("fields" in field) walk(field.fields)
      if (field.type === "tabs") for (const tab of field.tabs) walk(tab.fields)
      if (field.type === "blocks")
        for (const block of [...(field.blocks || []), ...(field.blockReferences || [])])
          if (typeof block !== "string") walk(block.fields)
    }
  }
  for (const collection of config.collections || []) walk(collection.fields)
  for (const global of config.globals || []) walk(global.fields)
  for (const block of config.blocks || []) walk(block.fields)
  return config
}
