import type { FieldHook } from "payload"

export const formatSlug = (val: string): string => {
  const normalized = typeof val === "string" ? val : ""

  return normalized
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export const formatSlugHook =
  (fallback: string): FieldHook =>
  ({ data, operation, value, originalDoc }) => {
    const providedValue = typeof value === "string" ? value.trim() : ""

    // If user provided a value, always use it (formatted)
    if (providedValue !== "") {
      return formatSlug(providedValue)
    }

    const incomingStatus = data?._status
    const previousStatus = originalDoc?._status
    const isPublishing = incomingStatus === "published"
    const wasPublished = previousStatus === "published"
    const isFirstPublish = isPublishing && !wasPublished

    const fallbackValue =
      (typeof data?.[fallback] === "string" && data[fallback]?.trim() !== ""
        ? data[fallback]
        : undefined) ??
      (typeof originalDoc?.[fallback] === "string" && originalDoc[fallback]?.trim() !== ""
        ? originalDoc[fallback]
        : undefined)

    const existingSlug =
      (typeof originalDoc?.slug === "string" && originalDoc.slug.trim() !== ""
        ? originalDoc.slug
        : undefined) ??
      (typeof data?.slug === "string" && data.slug.trim() !== "" ? data.slug : undefined)

    if (isFirstPublish) {
      if (fallbackValue) {
        return formatSlug(fallbackValue)
      }

      if (existingSlug) {
        return formatSlug(existingSlug)
      }

      throw new Error(
        "Slug cannot be empty when publishing. Please add a title or manually specify a slug."
      )
    }

    if (isPublishing && !existingSlug) {
      if (fallbackValue) {
        return formatSlug(fallbackValue)
      }

      throw new Error(
        "Slug cannot be empty when publishing. Please provide a slug before publishing."
      )
    }

    return existingSlug || ""
  }
