// Preserve the legacy Team input shape during upgrades; new collections define their fields directly.
export function normalizeContentBeforeValidate(args: {
  data?: Record<string, unknown>
}): void {
  if (args.data) {
    flattenContentGroupData(args.data)
  }
}

export function normalizeContentAfterRead(args: {
  doc?: Record<string, unknown> | null
}): Record<string, unknown> | undefined | null {
  if (args.doc) {
    flattenContentGroupData(args.doc)
    return args.doc
  }
  return args.doc ?? undefined
}

function flattenContentGroupData(target: Record<string, unknown> | undefined): void {
  if (!target || typeof target !== "object" || Array.isArray(target)) {
    return
  }

  const carrier = target as Record<string, unknown> & { content?: unknown }
  const content = carrier.content
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return
  }

  for (const [key, value] of Object.entries(content as Record<string, unknown>)) {
    if (!(key in carrier)) {
      carrier[key] = value
    }
  }

  delete carrier.content
}
