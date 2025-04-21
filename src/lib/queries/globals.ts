import { Config, getPayload } from "payload"
import { cache } from "react"
import configPromise from "@payload-config"
import { unstable_cache } from "next/cache"

type Global = keyof Config["globals"]

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

/*******************************************************/
/* Get Post By Slug
/*******************************************************/

async function getGlobal(slug: Global, depth = 0) {
  const payload = await getPayload({ config: configPromise })

  const global = await payload.findGlobal({
    slug,
    depth,
  })

  return global
}

/*******************************************************/
/* Get cached global
/*******************************************************/

export const getCachedGlobal = (slug: Global, depth = 0) =>
  unstable_cache(async () => getGlobal(slug, depth), [slug], {
    tags: [`global_${slug}`],
  })
