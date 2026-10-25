import { getDraftModeData } from "@/lib/data/draft"
import { RenderSections } from "@/lib/rendering/render-sections"
import { LivePreviewListener } from "@/components/cms/live-preview-listener"
import { routingEngine } from "@/lib/routing"
import { handleURIRedirect } from "@/lib/redirects"
import { notFound, redirect } from "next/navigation"
import { generateStructuredData } from "@/lib/structured-data"
import { getSettings } from "@/lib/data/globals"
import { cookies, draftMode, headers } from "next/headers"
import { createLocalReq, getPayload } from "payload"
import configPromise from "@payload-config"
import { publicPreviewPath } from "@/lib/preview-path"

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
  const URI = routingEngine.slugToURI(uri)
  const previewMode = await draftMode()

  if (!previewMode.isEnabled) {
    if ((await cookies()).has("__prerender_bypass")) {
      const query = new URLSearchParams()
      for (const [key, value] of Object.entries(searchParams ?? {})) {
        for (const item of Array.isArray(value)
          ? value
          : value === undefined
            ? []
            : [value])
          query.append(key, item)
      }
      const publicPath = publicPreviewPath(`${URI}?${query}`) ?? "/"
      redirect(`/api/exit-preview?redirect=${encodeURIComponent(publicPath)}`)
    }
    return notFound()
  }

  const payload = await getPayload({ config: configPromise })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })
  if (!user) return notFound()
  const req = await createLocalReq({ user, req: { headers: requestHeaders } }, payload)

  const previewCollection =
    typeof searchParams?.previewCollection === "string"
      ? searchParams.previewCollection
      : undefined
  const previewDocumentId =
    typeof searchParams?.previewDocumentId === "string"
      ? searchParams.previewDocumentId
      : undefined

  await handleURIRedirect(URI)

  const routeResponse = await getDraftModeData(URI, req, {
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

export { generateMetadata } from "@/lib/rendering/uri-renderer/metadata"
