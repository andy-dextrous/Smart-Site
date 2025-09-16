import type { Post } from "@/admin/payload/payload-types"
import { getRelatedPosts } from "@/admin/data/posts"
import Link from "next/link"

/*************************************************************************/
/*  RELATED POSTS (MINIMAL) - SECTION
/*************************************************************************/

export const RelatedPostsMinimalComponent: React.FC<{
  document?: Post
  heading?: string
  maxPosts?: number | null
}> = async ({ document, heading = "Related Posts", maxPosts = 3 }) => {
  const post = document as Post | undefined
  if (!post) return null

  const limit = typeof maxPosts === "number" && maxPosts > 0 ? maxPosts : 3
  const posts = await getRelatedPosts({ document: post, limit })
  if (!posts || posts.length === 0) return null

  return (
    <section className="bg-white">
      <div className="container">
        <h2 className="mb-6 text-xl font-semibold text-zinc-900">{heading}</h2>
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map(p => (
            <li key={p.id} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <Link href={p.uri || `/insights/${p.slug || ""}`} className="no-underline">
                <h3 className="mb-2 text-lg font-semibold text-zinc-900">{p.title}</h3>
              </Link>
              {p.seo?.meta?.description ? (
                <p className="mb-3 text-sm text-zinc-600">{p.seo.meta.description}</p>
              ) : null}
              <Link href={p.uri || `/insights/${p.slug || ""}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                Read more
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

