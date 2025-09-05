import { cache } from "@/admin/cache"
import { getDraftModeData } from "@/admin/data/draft"
import { RenderSections } from "@/admin/components/render-sections"
import { LivePreviewListener } from "@/admin/payload/components/frontend/live-preview-listener"
import { routingEngine } from "@/admin/routing"
import { handleURIRedirect } from "@/admin/redirects"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { generateMeta } from "@/admin/utilities/generate-meta"

/*************************************************************************/
/*  TYPES
/*************************************************************************/

interface SmartSiteURIRendererProps {
  params: Promise<{ uri?: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

/*************************************************************************/
/*  SMARTSITE URI RENDERER COMPONENT
/*************************************************************************/

export async function SmartSiteURIRenderer({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: SmartSiteURIRendererProps) {
  const { uri = [] } = await paramsPromise
  const searchParams = await searchParamsPromise
  const isPreview = searchParams?.preview === "true"

  const URI = routingEngine.slugToURI(uri)

  await handleURIRedirect(URI)

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
      {isPreview && <LivePreviewListener />}
      <RenderSections
        sections={document.sections}
        document={document}
        collection={collection}
        breadcrumbs={uriIndex.breadcrumbs}
        searchParams={searchParams}
        params={{ uri }}
      />
    </main>
  )
}

/*************************************************************************/
/*  METADATA GENERATION
/*************************************************************************/

export async function generateMetadata({
  params: paramsPromise,
}: {
  params: Promise<{ uri?: string[] }>
}): Promise<Metadata> {
  const { uri = [] } = await paramsPromise
  const URI = routingEngine.slugToURI(uri)

  const routeResponse = await cache.getByURI(URI)

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

/*************************************************************************/
/*  STATIC PARAMS GENERATION
/*************************************************************************/

export async function generateStaticParams(): Promise<{ uri: string[] }[]> {
  const allURIs = await cache.getAllURIs()

  return allURIs.map(uri => ({
    uri: uri === "/" ? [] : uri.split("/").filter(Boolean),
  }))
}
