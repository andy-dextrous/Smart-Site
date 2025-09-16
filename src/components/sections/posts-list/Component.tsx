import { getPostsWithPagination } from "@/admin/data/posts"
import type { PostsListBlock } from "@/admin/payload/payload-types"
import Link from "next/link"
import { cn } from "@/utilities/ui"

/*************************************************************************/
/*  POSTS LIST - MINIMAL COMPONENT
/*************************************************************************/

export const PostsListComponent: React.FC<PostsListBlock> = async props => {
  const { postsPerPage } = props
  // Handle null/undefined and invalid values from CMS (Payload may return null)
  const limit = typeof postsPerPage === "number" && postsPerPage > 0 ? postsPerPage : 6

  const posts = await getPostsWithPagination({ limit, page: 1 })

  return (
    <section className="bg-white py-16">
      <div className="container">
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.docs?.map(post => (
            <li key={post.id} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <Link href={post.uri || `/insights/${post.slug || ""}`} className="no-underline">
                <h3 className="text-xl font-semibold tracking-tight text-zinc-900">{post.title}</h3>
              </Link>
              {post.seo?.meta?.description ? (
                <p className="mt-3 text-sm leading-6 text-zinc-600">{post.seo.meta.description}</p>
              ) : null}
              <Link
                href={post.uri || `/insights/${post.slug || ""}`}
                className={cn(
                  "mt-6 inline-flex items-center text-sm font-semibold text-indigo-600 transition hover:text-indigo-700",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                )}
              >
                Read more
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
