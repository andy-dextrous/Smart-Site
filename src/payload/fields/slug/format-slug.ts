import type { FieldHook } from "payload"

export const formatSlug = (val: string): string =>
  val
    .replace(/ /g, "-")
    .replace(/[^\w-]+/g, "")
    .toLowerCase()

export const formatSlugHook =
  (fallback: string): FieldHook =>
  ({ data, operation, value, originalDoc }) => {
    // If user provided a value, always use it (formatted)
    if (typeof value === "string" && value.trim() !== "") {
      return formatSlug(value)
    }

    // Check if document is published (has _status !== 'draft' or no _status field)
    const isPublished =
      originalDoc?._status === "published" || (originalDoc && !originalDoc._status)

    // For new documents or unpublished documents, auto-generate from title
    // But only if no existing slug and not locked
    const shouldAutoGenerate =
      (operation === "create" || !isPublished) &&
      !data?.slugLock &&
      (!originalDoc?.slug || originalDoc.slug === "")

    if (shouldAutoGenerate) {
      const fallbackData = data?.[fallback]

      if (fallbackData && typeof fallbackData === "string") {
        return formatSlug(fallbackData)
      }
    }

    // Preserve existing slug for published documents or when locked
    return originalDoc?.slug || value || ""
  }
