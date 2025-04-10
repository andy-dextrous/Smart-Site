import queryPageBySlug from "@/lib/queries/page"
import { LivePreviewListener } from "@/payload/components/live-preview-listener"
import { PayloadRedirects } from "@/payload/components/payload-redirects"
import { Metadata } from "next"
import { draftMode } from "next/headers"
import { type RequiredDataFromCollectionSlug } from "payload"

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function Page({ params: paramsPromise }: Args) {
  const { slug = "home" } = await paramsPromise
  const url = "/" + slug
  const { isEnabled: draft } = await draftMode()

  const page: RequiredDataFromCollectionSlug<"pages"> | null = await queryPageBySlug({
    slug,
  })

  return (
    <article className="pt-16 pb-24">
      <PayloadRedirects disableNotFound url={url} />
      {draft && <LivePreviewListener />}
      <pre>{JSON.stringify(page || "no page", null, 2)}</pre>
    </article>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: `Payload Website Template Pages`,
  }
}
