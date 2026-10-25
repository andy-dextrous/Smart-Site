/** Searchable text comes only from the public search projection, never draft content. */
export function buildSearchText(doc: {
  title?: unknown
  slug?: unknown
  uri?: unknown
  meta?: { title?: unknown; description?: unknown } | null
  categories?: Array<{ title?: unknown }> | null
}): string {
  return [
    doc.title,
    doc.slug,
    doc.uri,
    doc.meta?.title,
    doc.meta?.description,
    ...(doc.categories || []).map(category => category?.title),
  ]
    .filter(Boolean)
    .map(value => String(value).toLowerCase())
    .join(" ")
    .trim()
}
