import { getAllPages, getPageBySlug } from "@/lib/queries/page"
import { RenderBlocks } from "@/payload/blocks/RenderBlocks"
import { LivePreviewListener } from "@/payload/components/live-preview-listener"
import { PayloadRedirects } from "@/payload/components/payload-redirects"
import { generateMeta } from "@/utilities/generateMeta"
import { Metadata } from "next"
import { draftMode } from "next/headers"
import { type RequiredDataFromCollectionSlug } from "payload"
import { Fragment } from "react"

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function Page({ params: paramsPromise }: Args) {
  const { slug = "home" } = await paramsPromise
  const url = "/" + slug
  const { isEnabled: draft } = await draftMode()

  const page: RequiredDataFromCollectionSlug<"pages"> | null = await getPageBySlug({
    slug,
    draft,
  })

  if (!page) {
    return <PayloadRedirects url={url} />
  }

  const { layout = [] } = page

  return (
    <Fragment>
      <PayloadRedirects disableNotFound url={url} />
      {draft && <LivePreviewListener />}
      <RenderBlocks blocks={layout} />
    </Fragment>
  )
}

/*******************************************************/
/* Generate Static Params
/*******************************************************/

export async function generateStaticParams() {
  const pages = await getAllPages()

  if (!pages) {
    return []
  }

  const params = pages
    ?.filter(doc => {
      return doc.slug !== "home"
    })
    .map(({ slug }) => {
      return { slug }
    })

  return params
}

/*******************************************************/
/* Generate Metadata
/*******************************************************/

export async function generateMetadata({
  params: paramsPromise,
}: Args): Promise<Metadata> {
  const { slug = "home" } = await paramsPromise
  const { isEnabled: draft } = await draftMode()
  const page = await getPageBySlug({
    slug,
    draft,
  })

  return generateMeta({ doc: page })
}
