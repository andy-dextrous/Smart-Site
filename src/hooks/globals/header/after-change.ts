import type { GlobalAfterChangeHook } from "payload"
import { queuePublication } from "@/website/publication/intent"
export const afterHeaderChange: GlobalAfterChangeHook = async ({ doc, req, global }) => {
  await queuePublication(req, "refresh", `global/${global.slug}`)
  return doc
}
