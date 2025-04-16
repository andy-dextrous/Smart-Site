import type { FieldHook } from "payload"

export const formatSlug = (val: string): string =>
  val
    .replace(/ /g, "-")
    .replace(/[^\w-]+/g, "")
    .toLowerCase()

export const formatSlugHook =
  (fallback: string): FieldHook =>
  ({ data, operation, value }) => {
    if (typeof value === "string") {
      return formatSlug(value)
    }

    // Handle both create operations AND cases where the slug is empty/not set
    // This ensures new documents get a proper slug initially
    if (operation === "create" || !data?.slug) {
      const fallbackData = data?.[fallback] || data?.[fallback]

      if (fallbackData && typeof fallbackData === "string") {
        return formatSlug(fallbackData)
      }
    }

    return value
  }
