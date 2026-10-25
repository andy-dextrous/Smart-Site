import { cache } from "@/lib/cache"
import { RenderSections } from "@/lib/rendering/render-sections"
import { routingEngine } from "@/lib/routing"
import { handleURIRedirect } from "@/lib/redirects"
import { notFound } from "next/navigation"
import { generateStructuredData } from "@/lib/structured-data"
import { getSettings } from "@/lib/data/globals"

/*************************************************************************/
/*  TYPES
/*************************************************************************/

interface SmartSitePublishedURIRendererProps {
  params: Promise<{ uri?: string[] }>
}

/*************************************************************************/
/*  SMARTSITE PUBLISHED URI RENDERER COMPONENT
/*************************************************************************/

export async function SmartSitePublishedURIRenderer({
  params: paramsPromise,
}: SmartSitePublishedURIRendererProps) {
  const { uri = [] } = await paramsPromise
  const URI = routingEngine.slugToURI(uri)

  await handleURIRedirect(URI)

  const routeResponse = await cache.getByURI(URI)

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
        params={{ uri }}
      />
    </main>
  )
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
