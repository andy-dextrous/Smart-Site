import type { PostsArchiveBlock, Post } from "@/admin/payload/payload-types"
import type { PageData } from "@/admin/components/render-sections"
import { getPostsWithPagination } from "@/admin/data/posts"
import { Section } from "@/components/fields/section"
import { PageRange } from "@/components/fields/pagination/page-range"
import { PostCard } from "@/components/posts/post-card"
import { Pagination } from "@/components/fields/pagination"
import { tv } from "tailwind-variants"

type ArchiveLayout = NonNullable<PostsArchiveBlock["layout"]>
type ArchiveColumns = NonNullable<PostsArchiveBlock["columns"]>

const archiveVariants = tv({
  slots: {
    container: "flex flex-col gap-content-lg",
    grid: "",
    controls: "flex flex-col gap-content",
    range: "text-sm",
    card: "",
  },
  variants: {
    layout: {
      grid: {
        grid: "grid gap-grid",
      },
      list: {
        grid: "flex flex-col gap-content",
        card: "flex flex-col md:flex-row md:items-center md:gap-content",
      },
    },
    columns: {
      two: { grid: "md:grid-cols-2" },
      three: { grid: "md:grid-cols-2 lg:grid-cols-3" },
      four: { grid: "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" },
    },
    tone: {
      light: {
        range: "text-dark-600",
      },
      neutral: {
        range: "text-dark-600",
      },
      dark: {
        range: "text-white/70",
      },
    },
  },
  defaultVariants: {
    layout: "grid",
    columns: "three",
    tone: "light",
  },
})

function normalizeCategoryFilter(categoryFilter: PostsArchiveBlock["categoryFilter"]) {
  if (!categoryFilter) return undefined

  return categoryFilter
    .map(category => {
      if (!category) return null
      if (typeof category === "string") return category
      if (typeof category === "number") return String(category)
      if (typeof category === "object" && category.id) return String(category.id)
      return null
    })
    .filter((value): value is string => Boolean(value))
}

export async function PostsArchiveComponent(props: PostsArchiveBlock & PageData) {
  const {
    postsPerPage,
    layout,
    columns,
    showExcerpt,
    showCategories,
    showPublishedDate,
    showReadingTime,
    showPagination,
    showPageRange,
    categoryFilter,
    offset,
    sort,
    searchParams,
    document,
    sectionSettings,
  } = props

  const colorScheme = sectionSettings?.colorScheme ?? null
  const tone: "light" | "neutral" | "dark" =
    colorScheme === "dark" ? "dark" : colorScheme === "light" ? "light" : "neutral"
  const appearance: "neutral" | "light" | "dark" = tone === "neutral" ? "neutral" : tone

  const resolvedLimit = postsPerPage ?? 9
  const requestedLayout = layout ?? "grid"
  const resolvedLayout: ArchiveLayout = requestedLayout
  const resolvedColumns: ArchiveColumns = columns ?? "three"
  const shouldShowExcerpt = showExcerpt !== false
  const shouldShowCategories = showCategories !== false
  const shouldShowPublishedDate = showPublishedDate !== false
  const shouldShowReadingTime = showReadingTime === true
  const shouldShowPagination = showPagination !== false
  const shouldShowPageRange = showPageRange !== false
  const normalizedOffset = offset ?? 0
  const normalizedSort = sort ?? "-publishedAt"

  const currentPageParam = searchParams?.page
  const currentPage =
    typeof currentPageParam === "string" ? Math.max(parseInt(currentPageParam, 10) || 1, 1) : 1

  const categoryIds = normalizeCategoryFilter(categoryFilter)

  const posts = await getPostsWithPagination({
    limit: resolvedLimit,
    page: currentPage,
    categoryFilter: categoryIds,
    offset: normalizedOffset,
    sort: normalizedSort,
  })

  const archiveUri =
    document?.breadcrumbs?.[document.breadcrumbs.length - 1]?.url || "/posts"

  const {
    container,
    grid,
    controls,
    range,
    card,
  } = archiveVariants({
    layout: resolvedLayout,
    columns: resolvedLayout === "grid" ? resolvedColumns : undefined,
    tone,
  })

  const containerClassName = container()
  const gridClassName = grid()
  const controlsClassName = controls()
  const rangeClassName = range()
  const cardClassName = card()

  return (
    <Section sectionSettings={sectionSettings} containerClassName={containerClassName}>
      <div className={gridClassName}>
        {posts.docs.map(post => (
          <PostCard
            key={(post as Post).id}
            post={post as Post}
            appearance={appearance}
            showExcerpt={shouldShowExcerpt}
            showCategories={shouldShowCategories}
            showPublishedDate={shouldShowPublishedDate}
            showReadingTime={shouldShowReadingTime}
            className={cardClassName || undefined}
          />
        ))}
      </div>

      {shouldShowPagination && posts.totalPages > 1 ? (
        <div className={controlsClassName}>
          {shouldShowPageRange ? (
            <PageRange
              collection="posts"
              currentPage={posts.page}
              limit={resolvedLimit}
              totalDocs={posts.totalDocs}
              className={rangeClassName}
            />
          ) : null}

          <Pagination
            page={posts.page}
            totalPages={posts.totalPages}
            archiveUri={archiveUri}
            colorVariant={tone}
          />
        </div>
      ) : null}
    </Section>
  )
}
