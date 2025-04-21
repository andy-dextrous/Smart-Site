"use server"

import type { Config } from "@/payload/payload-types"

import { getPayload } from "payload"
import configPromise from "@payload-config"

// Define CollectionSlug type from Config interface
type CollectionSlug = keyof Config["collections"]

export const getContentCollections = async () => {
  const payload = await getPayload({ config: configPromise })

  const collectionSlugs = Object.keys(payload.collections) as CollectionSlug[]

  // Filter out internal Payload collections
  const nonPayloadCollections = collectionSlugs.filter(
    slug => !slug.startsWith("payload-") && !["form-submissions", "search"].includes(slug)
  )

  // Create an array to store all collections data
  const collectionsData = []

  // Fetch each collection
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
