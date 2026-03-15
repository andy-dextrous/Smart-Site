import { getDraftModeData } from "@/admin/data/draft"
import { RenderSections } from "@/admin/components/render-sections"
import { LivePreviewListener } from "@/admin/payload/components/frontend/live-preview-listener"
import { routingEngine } from "@/admin/routing"
import { handleURIRedirect } from "@/admin/redirects"
import { notFound } from "next/navigation"
import { generateStructuredData } from "@/admin/utilities/structured-data"
import { getSettings } from "@/admin/data/globals"
import { draftMode } from "next/headers"

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
  const previewMode = await draftMode()

  if (!previewMode.isEnabled) {
    return notFound()
  }

  const { uri = [] } = await paramsPromise
  const searchParams = await searchParamsPromise
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

  const routeResponse = await getDraftModeData(URI, {
    collection: previewCollection,
    documentId: previewDocumentId,
  })

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
      <LivePreviewListener />
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

export { generateMetadata } from "./uri-renderer/metadata"
