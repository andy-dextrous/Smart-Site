import type { Metadata } from "next"
import configPromise from "@payload-config"
import { getPayload } from "payload"
import queryPostBySlug from "@/lib/queries/post"

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const posts = await payload.find({
    collection: "posts",
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
  })

  const params = posts.docs.map(({ slug }) => {
    return { slug }
  })

  return params
}

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function Post({ params: paramsPromise }: Args) {
  const { slug = "" } = await paramsPromise
  const post = await queryPostBySlug({ slug })

  return (
    <article className="pt-16 pb-16">
      <pre>{JSON.stringify(post, null, 2)}</pre>
    </article>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: `Payload Website Template Post Single`,
  }
}
