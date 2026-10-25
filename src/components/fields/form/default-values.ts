// Form definitions describe fields; React Hook Form needs values keyed by name.
export function formDefaultValues(fields: readonly unknown[] = []): Record<string, unknown> {
  return Object.fromEntries(fields.flatMap(field => {
    if (!field || typeof field !== "object" || !("name" in field) || typeof field.name !== "string") return []
    const value = "defaultValue" in field ? field.defaultValue : undefined
    const checkbox = "blockType" in field && field.blockType === "checkbox"
    return [[field.name, value ?? (checkbox ? false : "")]]
  }))
}
