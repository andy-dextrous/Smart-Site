import type { Field, SanitizedConfig } from "payload"

// Capture persisted shape, not function source or environment-specific UI values.
export function siteContract(config: SanitizedConfig) {
  const fields = (items: Field[]): unknown[] => items.map((field: any) => {
    const result: Record<string, unknown> = {}
    for (const key of ["name", "type", "required", "unique", "index", "localized", "hasMany", "relationTo", "maxDepth", "enumName"]) {
      if (field[key] !== undefined) result[key] = field[key]
    }
    if (field.fields) result.fields = fields(field.fields)
    if (field.tabs) result.tabs = field.tabs.map((tab: any) => ({ name: tab.name, fields: fields(tab.fields) }))
    if (field.blocks) result.blocks = field.blocks.map((block: any) => typeof block === "string" ? block : ({ slug: block.slug, fields: fields(block.fields) }))
    return result
  })
  return {
    collections: config.collections.map(c => ({ slug: c.slug, fields: fields(c.fields), versions: c.versions, timestamps: c.timestamps, auth: Boolean(c.auth), indexes: c.indexes })).sort((a,b) => a.slug.localeCompare(b.slug)),
    globals: config.globals.map(g => ({ slug: g.slug, fields: fields(g.fields), versions: g.versions })).sort((a,b) => a.slug.localeCompare(b.slug)),
  }
}
