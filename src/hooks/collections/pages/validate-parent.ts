import { MAX_PAGE_NODES } from "@/website/routing/limits"
import { APIError, type CollectionBeforeValidateHook } from "payload"

/** Reject cycles before nested-docs traverses parents to build breadcrumbs. */
export const validatePageParent: CollectionBeforeValidateHook = async ({
  data,
  originalDoc,
  req,
}) => {
  if (!data || !("parent" in data)) return data
  const seen = new Set<string>(originalDoc?.id ? [String(originalDoc.id)] : [])
  let nodeCount = 1
  let parent = typeof data.parent === "object" ? data.parent?.id : data.parent
  while (parent) {
    if (seen.has(String(parent)) || nodeCount >= MAX_PAGE_NODES)
      throw new APIError(`Page parent creates a cycle or exceeds ${MAX_PAGE_NODES} total pages`, 400)
    seen.add(String(parent))
    nodeCount++
    const ancestor = await req.payload.findByID({
      collection: "pages",
      id: parent,
      depth: 0,
      req,
      overrideAccess: true,
    })
    parent = typeof ancestor.parent === "object" ? ancestor.parent?.id : ancestor.parent
  }
  return data
}
