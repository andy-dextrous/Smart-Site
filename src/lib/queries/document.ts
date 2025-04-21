import type { Config } from "@/payload/payload-types"

import configPromise from "@payload-config"
import { getPayload } from "payload"
import { unstable_cache } from "next/cache"

type Collection = keyof Config["collections"]

/*******************************************************/
/* Get Document By Slug
/*******************************************************/

async function getDocument(
  collection: Collection | Collection[],
  slug: string,
  depth = 0
) {
  const payload = await getPayload({ config: configPromise })

  if (Array.isArray(collection)) {
    const results = await Promise.all(
      collection.map(async col => {
        const result = await payload.find({
          collection: col,
          depth,
          where: {
            slug: {
              equals: slug,
            },
          },
        })
        return result.docs[0] || null
      })
    )

    const validResults = results.filter(Boolean)
    return validResults.length > 0 ? validResults[0] : null
  }

  const page = await payload.find({
    collection,
    depth,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return page.docs[0]
}

/*******************************************************/
/* Get cached document
/*******************************************************/

export const getCachedDocument = (
  collection: Collection | Collection[],
  slug: string,
  depth = 0
) =>
  unstable_cache(
    async () => getDocument(collection, slug, depth),
    [
      Array.isArray(collection) ? collection.join("_") : collection,
      slug,
      depth.toString(),
    ],
    {
      tags: Array.isArray(collection)
        ? collection.map(col => `${col}_${slug}`)
        : [`${collection}_${slug}`],
    }
  )
