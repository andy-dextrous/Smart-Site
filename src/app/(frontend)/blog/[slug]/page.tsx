import type { Metadata } from "next"
import { PayloadRedirects } from "@/payload/components/payload-redirects"
import { draftMode } from "next/headers"
import PostBody from "@/components/posts/post-body"
import { PostHero } from "@/components/posts/post-hero"
import { getPostBySlug, getPosts } from "@/lib/queries/post"
import { LivePreviewListener } from "@/payload/components/live-preview-listener"
import { generateMeta } from "@/utilities/generateMeta"

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function Post({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = "" } = await paramsPromise
  const url = "/blog/" + slug
  const post = await getPostBySlug({ slug })

  if (!post) return <PayloadRedirects url={url} />

  return (
    <main data-collection="posts" data-single-type="post" data-id={post.id}>
      <PayloadRedirects disableNotFound url={url} />
      {draft && <LivePreviewListener />}
      <article className="pt-16 pb-16">
        <PostHero post={post} />
        <PostBody post={post} />
      </article>
    </main>
  )
}

/*******************************************************/
/* Generate Static Params
/*******************************************************/

export async function generateStaticParams() {
  const posts = await getPosts()

  const params = posts.map(({ slug }) => {
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
  const { slug = "" } = await paramsPromise
  const post = await getPostBySlug({ slug })

  return generateMeta({ doc: post })
}
