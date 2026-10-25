import type { PayloadRequest } from "payload"

/** Legacy profiles may be content without a page. Never invent a URL for them. */
export async function isUnroutedDocument({
  req,
  collection,
  data,
  originalDoc,
}: {
  req: PayloadRequest
  collection: string
  data: any
  originalDoc?: any
}): Promise<boolean> {
  const slug = data?.slug
  if (typeof slug === "string" && slug.trim()) return false
  if (slug !== undefined && slug !== null && typeof slug !== "string")
    throw new Error(
      `Invalid slug for ${collection}/${data?.id || originalDoc?.id || "new"}`
    )

  const id = data?.id || originalDoc?.id
  const label = `${collection}/${id || "new"}`
  let routing: any
  if (collection === "pages" && id) {
    const settings = await req.payload.findGlobal({
      slug: "settings",
      req,
      depth: 0,
      overrideAccess: true,
    })
    routing = settings.routing || {}
    const home = routing.homepage?.id || routing.homepage
    // The homepage is selected by ID and legitimately has the root URL.
    if (home && String(home) === String(id)) return false
  }
  if (data?.uri || originalDoc?.uri)
    throw new Error(`Cannot omit the slug from an existing route: ${label}`)
  if (id) {
    const indexed = await req.payload.find({
      collection: "uri-index",
      req,
      depth: 0,
      limit: 1,
      pagination: false,
      overrideAccess: true,
      where: {
        and: [
          { sourceCollection: { equals: collection } },
          { documentId: { equals: String(id) } },
        ],
      },
    })
    if (indexed.docs.length)
      throw new Error(`Cannot omit the slug from an indexed route: ${label}`)
    if (collection === "pages") {
      const archive = Object.entries(routing).some(
        ([key, value]: [string, any]) =>
          key.endsWith("ArchivePage") && String(value?.id || value) === String(id)
      )
      const children = await req.payload.find({
        collection: "pages",
        req,
        depth: 0,
        limit: 1,
        pagination: false,
        overrideAccess: true,
        where: { parent: { equals: id } },
      })
      if (archive || children.docs.length)
        throw new Error(`Cannot omit the slug from a referenced page: ${label}`)
    }
  }
  return true
}
