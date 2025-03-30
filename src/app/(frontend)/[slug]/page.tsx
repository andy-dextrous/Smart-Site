import queryPageBySlug from "@/lib/queries/page"
import { Metadata } from "next"
import { type RequiredDataFromCollectionSlug } from "payload"

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function Page({ params: paramsPromise }: Args) {
  const { slug = "home" } = await paramsPromise

  const page: RequiredDataFromCollectionSlug<"pages"> | null = await queryPageBySlug({
    slug,
  })

  return (
    <article className="pt-16 pb-24">
      <pre>{JSON.stringify(page || "no page", null, 2)}</pre>
    </article>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: `Payload Website Template Pages`,
  }
}
