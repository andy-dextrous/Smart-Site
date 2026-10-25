import type { GlobalAfterChangeHook } from "payload"
import { queuePublication } from "@/lib/publication/intent"
export const afterSettingsChange: GlobalAfterChangeHook = async ({
  doc,
  req,
  global,
}) => {
  await queuePublication(req, "routes", `global/${global.slug}`)
  return doc
}
