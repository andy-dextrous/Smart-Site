import type { Metadata } from "next"

import { routingEngine } from "@/website/routing"
import { cache } from "@/website/cache"
import { generateMeta } from "@/utilities/generate-meta"

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
