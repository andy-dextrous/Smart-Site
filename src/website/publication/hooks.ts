import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload"
import { queuePublication } from "@/website/publication/intent"
export const refreshRelatedContent: CollectionAfterChangeHook = async ({
  doc,
  req,
  collection,
}) => {
  await queuePublication(req, "refresh", `${collection.slug}/${doc.id}`)
  return doc
}
export const refreshDeletedContent: CollectionAfterDeleteHook = async ({
  doc,
  req,
  collection,
}) => {
  await queuePublication(req, "refresh", `${collection.slug}/${doc.id}`)
  return doc
}
