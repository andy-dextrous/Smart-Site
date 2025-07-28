import { SectionIntro } from "@/components/layout/section-intro"
import { PostCard } from "@/components/posts/post-card"
import { PageRange } from "@/admin/payload/components/frontend/page-range"
import { Pagination } from "@/admin/payload/components/frontend/pagination"
import { getPostsWithPagination } from "@/admin/lib/data/posts"
import type { PostsArchiveBlock } from "@/admin/payload/payload-types"
import { cn } from "@/utilities/ui"

/*************************************************************************/
/*  POSTS ARCHIVE SECTION COMPONENT
/*************************************************************************/

export const PostsArchiveComponent: React.FC<PostsArchiveBlock> = async props => {
  const {
    heading,
    description,
    postsPerPage = 12,
    layout = "grid",
    columns = "three",
    showPagination = true,
    showPageRange = true,
    categoryFilter,
  } = props

  // Extract category IDs for filtering if specified
  const categoryIds =
    categoryFilter && categoryFilter.length > 0
      ? categoryFilter
          .filter(cat => typeof cat === "object" && cat !== null)
          .map(cat => (typeof cat === "object" ? cat.id : cat))
          .filter(Boolean)
      : undefined

  const posts = await getPostsWithPagination({
    limit: postsPerPage || 12,
    page: 1, // TODO: Add page parameter support
    categoryFilter: categoryIds,
  })

  // Build grid classes based on column selection
  const gridClasses = cn("grid gap-0 md:gap-8", {
    "grid-cols-1 md:grid-cols-2": layout === "grid" && columns === "two",
    "grid-cols-1 md:grid-cols-2 lg:grid-cols-3": layout === "grid" && columns === "three",
    "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4":
      layout === "grid" && columns === "four",
    "grid-cols-1": layout === "list",
  })

  return (
    <section className="bg-dark side-border-light flicker-mask-top py-first-section-nav-offset">
      {/* Section Intro */}
      <SectionIntro
        heading={heading || undefined}
        description={description || undefined}
        headingClassName="text-white"
        descriptionClassName="text-white"
      />

      <div className="border-dark-border w-full border-t">
        <div className="md:container-md">
          {/* Page Range */}
          {showPageRange && (
            <div className="container mb-8">
              <PageRange
                collection="posts"
                currentPage={posts.page}
                limit={postsPerPage || 12}
                totalDocs={posts.totalDocs}
                className="text-white"
              />
            </div>
          )}

          {/* Posts Grid/List */}
          <div className={gridClasses}>
            {posts.docs?.map(post => (
              <PostCard
                key={post.id}
                post={post as any}
                className={cn(
                  layout === "grid" ? "border-x-none border-y md:border-x" : "border-b"
                )}
              />
            ))}
          </div>

          {/* Pagination */}
          {showPagination && posts.totalPages > 1 && posts.page && (
            <div className="container mt-8">
              <Pagination page={posts.page} totalPages={posts.totalPages} />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
