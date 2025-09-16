import type { Post } from "@/admin/payload/payload-types"

/*************************************************************************/
/*  POST HERO (MINIMAL) - SECTION
/*************************************************************************/

export const PostHeroMinimalComponent: React.FC<{
  document?: Post
  showAuthor?: boolean | null
  showPublishDate?: boolean | null
  showCategories?: boolean | null
}> = ({ document, showAuthor = true, showPublishDate = true, showCategories = true }) => {
  const post = document as Post | undefined
  if (!post) return null

  const categories = Array.isArray(post.categories) ? post.categories : []
  const authorNames = Array.isArray((post as any).populatedAuthors)
    ? (post as any).populatedAuthors.map((a: any) => a?.name).filter(Boolean).join(", ")
    : undefined

  const date = post.publishedAt ? new Date(post.publishedAt) : null
  const formattedDate = date
    ? date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : undefined

  return (
    <section className="side-border-dark bg-zinc-50 pt-nav min-h-[60vh] flex items-center border-b border-zinc-200">
      <div className="container-sm text-balance w-full text-left">
        <div className="mx-auto max-w-3xl">
          {showCategories && categories.length > 0 ? (
            <div className="mb-4 text-xs font-medium uppercase tracking-wide text-zinc-500">
              {categories
                .map(cat => (typeof cat === "object" && cat?.title ? cat.title : null))
                .filter(Boolean)
                .join(", ")}
            </div>
          ) : null}
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 md:text-5xl">{post.title}</h1>
          {(showAuthor || showPublishDate) && (authorNames || formattedDate) ? (
            <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-600">
              {showAuthor && authorNames ? <span>By {authorNames}</span> : null}
              {showAuthor && authorNames && showPublishDate && formattedDate ? <span className="text-zinc-400">•</span> : null}
              {showPublishDate && formattedDate ? <span>{formattedDate}</span> : null}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}
