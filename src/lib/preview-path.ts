const previewParameters = [
  "preview",
  "livePreview",
  "previewCollection",
  "previewDocumentId",
]
const localOrigin = "https://preview.invalid"

/** Normalize a public return path without accepting a second URL origin. */
export function publicPreviewPath(value: string): string | null {
  if (!value.startsWith("/") || /[\\\u0000-\u0020]/.test(value)) return null
  try {
    const target = new URL(value, localOrigin)
    if (target.origin !== localOrigin) return null
    while (target.pathname === "/preview" || target.pathname.startsWith("/preview/")) {
      target.pathname = target.pathname.slice("/preview".length) || "/"
    }
    // Check after dot-segment normalization and prefix removal, including encoded
    // separators which a browser or proxy may decode on the next request.
    const decodedPath = decodeURIComponent(target.pathname)
    if (
      target.pathname.startsWith("//") ||
      decodedPath.startsWith("//") ||
      /[\\\u0000-\u001f]/.test(decodedPath)
    )
      return null
    for (const key of previewParameters) target.searchParams.delete(key)
    return `${target.pathname}${target.search}`
  } catch {
    return null
  }
}
