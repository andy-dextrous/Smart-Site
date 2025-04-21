"use server"

import type { Config } from "@/payload/payload-types"

import { getPayload } from "payload"
import configPromise from "@payload-config"

type CollectionSlug = keyof Config["collections"]

/*******************************************************/
/* Get Content Collections
/*******************************************************/

const EXCLUDED_COLLECTIONS = ["form-submissions", "search"]

export const getContentCollections = async () => {
  const payload = await getPayload({ config: configPromise })

  const collectionSlugs = Object.keys(payload.collections) as CollectionSlug[]

  const nonPayloadCollections = collectionSlugs.filter(
    slug => !slug.startsWith("payload-") && !EXCLUDED_COLLECTIONS.includes(slug)
  )

  const collectionsData = []

  for (const slug of nonPayloadCollections) {
    const collection = await payload.find({
      collection: slug,
      depth: 0,
      limit: 0,
      pagination: false,
    })

    collectionsData.push({
      slug,
      docs: collection.docs,
      totalDocs: collection.totalDocs,
    })
  }

  return collectionsData
}
