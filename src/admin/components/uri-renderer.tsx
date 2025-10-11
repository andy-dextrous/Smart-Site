import { cache } from "@/admin/cache"
import { getDraftModeData } from "@/admin/data/draft"
import { RenderSections } from "@/admin/components/render-sections"
import { LivePreviewListener } from "@/admin/payload/components/frontend/live-preview-listener"
import { routingEngine } from "@/admin/routing"
import { handleURIRedirect } from "@/admin/redirects"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { generateMeta } from "@/admin/utilities/generate-meta"
import { generateStructuredData } from "@/admin/utilities/structured-data"
import { getSettings } from "@/admin/data/globals"

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
  const previewCollection =
    typeof searchParams?.previewCollection === "string"
      ? searchParams.previewCollection
      : undefined
  const previewDocumentId =
    typeof searchParams?.previewDocumentId === "string"
      ? searchParams.previewDocumentId
      : undefined

  const URI = routingEngine.slugToURI(uri)

  await handleURIRedirect(URI)

  const routeResponse = isPreview
    ? await getDraftModeData(URI, {
        collection: previewCollection,
        documentId: previewDocumentId,
      })
    : await cache.getByURI(URI)

  if (!routeResponse?.document) {
    return notFound()
  }

  const { document, uriIndex } = routeResponse
  const collection = uriIndex.sourceCollection

  let structuredDataJson: string | null = null

  if ((document as any)?.seo?.structuredData?.enableStructuredData) {
    const settings = await getSettings()
    const schemas = generateStructuredData(document, settings)

    if (schemas.length > 0) {
      const json = schemas.length === 1 ? schemas[0] : schemas
      structuredDataJson = JSON.stringify(json, null, 2)
    }
  }

  return (
    <main data-collection={collection} data-id={document.id}>
      {isPreview && <LivePreviewListener />}
      {structuredDataJson && (
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: structuredDataJson }}
        />
      )}
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
