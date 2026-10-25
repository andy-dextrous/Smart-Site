import {
  APIError,
  type CollectionBeforeDeleteHook,
  type CollectionBeforeChangeHook,
  type PayloadRequest,
} from "payload"
import { websiteCollections } from "@/website/collection-metadata"

async function requireDetachedPage(id: string | number, req: PayloadRequest) {
  const children = await req.payload.count({
    collection: "pages",
    req,
    where: { parent: { equals: id } },
    overrideAccess: true,
    trash: true,
  })
  if (children.totalDocs)
    throw new APIError(
      "Reparent this page's children before deleting or trashing it",
      400
    )
  const settings = await req.payload.findGlobal({
    slug: "settings",
    req,
    depth: 0,
    overrideAccess: true,
  })
  for (const collection of websiteCollections(req.payload.config)) {
    const value = (settings.routing as any)?.[`${collection.slug}ArchivePage`]
    if (String(typeof value === "object" ? value?.id : value) === String(id))
      throw new APIError(
        `Choose another archive page for ${collection.slug} in Settings before deleting or trashing this page`,
        400
      )
  }
}
export const protectPageDeletion: CollectionBeforeDeleteHook = async ({ id, req }) =>
  requireDetachedPage(id, req)
export const protectPageTrash: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
}) => {
  if (data.deletedAt && !originalDoc?.deletedAt && originalDoc?.id) {
    await requireDetachedPage(originalDoc.id, req)
    const settings = await req.payload.findGlobal({
      slug: "settings",
      req,
      depth: 0,
      overrideAccess: true,
    })
    const home = settings.routing?.homepage
    if (String(typeof home === "object" ? home?.id : home) === String(originalDoc.id)) {
      await req.payload.updateGlobal({
        slug: "settings",
        req,
        data: { routing: { ...settings.routing, homepage: null } },
        overrideAccess: true,
      })
    }
  }
  return data
}
