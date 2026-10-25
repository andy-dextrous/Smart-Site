import type { CollectionAfterChangeHook } from "payload"
import { queuePublication } from "@/lib/publication/intent"
export const afterTemplateChange: CollectionAfterChangeHook = async ({ doc, req }) => {
  await queuePublication(req, "refresh", `templates/${doc.id}`)
  return doc
}
