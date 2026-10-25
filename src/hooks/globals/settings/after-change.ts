import type { GlobalAfterChangeHook } from "payload"
import { queuePublication } from "@/website/publication/intent"
export const afterSettingsChange: GlobalAfterChangeHook = async ({
  doc,
  req,
  global,
}) => {
  await queuePublication(req, "routes", `global/${global.slug}`)
  return doc
}
