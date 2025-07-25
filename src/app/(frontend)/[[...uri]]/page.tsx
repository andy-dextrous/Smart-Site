import { RenderSections } from "@/components/sections/RenderSections"
import { cache } from "@/lib/cache"
import { routingEngine } from "@/lib/routing"
import { getDraftModeData } from "@/lib/data/draft"
import { LivePreviewListener } from "@/payload/components/frontend/live-preview-listener"
import { PayloadRedirects } from "@/payload/components/frontend/payload-redirects"
import { generateMeta } from "@/utilities/generate-meta"
import { Metadata } from "next"
import { notFound } from "next/navigation"

type Args = {
  params: Promise<{
    uri?: string[]
  }>
  searchParams?: Promise<{
    preview?: string
  }>
}

/*************************************************************************/
/*  MAIN PAGE COMPONENT
/*************************************************************************/

export default async function Page({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: Args) {
  const { uri = [] } = await paramsPromise
  const searchParams = await searchParamsPromise
  const isPreview = searchParams?.preview === "true"

  const URI = routingEngine.slugToURI(uri)

  const routeResponse = isPreview
    ? await getDraftModeData(URI)
    : await cache.getByURI(URI)

  if (!routeResponse?.document) {
    return notFound()
  }

  const { document, uriIndex } = routeResponse
  const collection = uriIndex.sourceCollection

  return (
    <main data-collection={collection} data-id={document.id}>
      {/* <PayloadRedirects disableNotFound url={URI} /> */}
      {isPreview && <LivePreviewListener />}
      <RenderSections
        sections={document.sections}
        document={document}
        collection={collection}
        breadcrumbs={uriIndex.breadcrumbs}
      />
    </main>
  )
}

/*************************************************************************/
/*  GENERATE STATIC PARAMS - NOW FULLY FUNCTIONAL
/*************************************************************************/

export async function generateStaticParams() {
  const uris = await cache.getAllURIs()

  return uris.map((uri: string) => ({
    slug: routingEngine.uriToSlug(uri),
  }))
}

/*************************************************************************/
/*  GENERATE METADATA - NOW CACHED AND STATIC
/*************************************************************************/

export async function generateMetadata({
  params: paramsPromise,
}: Args): Promise<Metadata> {
  const { uri = [] } = await paramsPromise
  const URI = routingEngine.slugToURI(uri)
  const route = await cache.getByURI(URI)

  return (
    generateMeta({
      doc: route?.document,
      collection: route?.uriIndex?.sourceCollection,
    }) || {}
  )
}
