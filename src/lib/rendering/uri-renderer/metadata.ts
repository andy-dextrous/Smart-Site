import type { Metadata } from "next"

import { routingEngine } from "@/lib/routing"
import { cache } from "@/lib/cache"
import { generateMeta } from "@/lib/generate-meta"

type ParamsPromise = Promise<{
  uri?: string[]
}>

type GenerateMetadataArgs = {
  params: ParamsPromise
}

export async function generateMetadata({
  params,
}: GenerateMetadataArgs): Promise<Metadata> {
  const { uri = [] } = await params
  const resolvedURI = routingEngine.slugToURI(uri)

  const routeResponse = await cache.getByURI(resolvedURI)

  if (!routeResponse?.document) {
    return {}
  }

  const { document, uriIndex } = routeResponse
  const collection = uriIndex.sourceCollection

  return generateMeta({
    doc: document,
    collection,
  })
}
