import { getPayload } from "payload"
import { cache } from "react"
import configPromise from "@payload-config"
import { draftMode } from "next/headers"

/*******************************************************/
/* Get Post By Slug
/*******************************************************/

export const getSettings = cache(async () => {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.findGlobal({
    slug: "settings",
    depth: 4,
    locale: "all",
    fallbackLocale: false,
    overrideAccess: false,
    showHiddenFields: true,
  })

  return result
})
