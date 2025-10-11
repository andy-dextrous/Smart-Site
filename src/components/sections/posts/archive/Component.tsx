import type { PostsArchiveBlock, Post } from "@/admin/payload/payload-types"
import type { PageData } from "@/admin/components/render-sections"
import { getPostsWithPagination } from "@/admin/data/posts"
import { Section } from "@/components/fields/section"
import { PageRange } from "@/components/fields/pagination/page-range"
import { PostCard } from "@/components/posts/post-card"
import Link from "next/link"

import { cn } from "@/utilities/ui"

type ArchiveLayout = "grid" | "list"
type ArchiveColumns = "two" | "three" | "four"
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

function appearanceFromColorScheme(colorScheme?: string | null) {
  if (colorScheme === "dark") return "dark"
  if (colorScheme === "light") return "light"
  return "neutral"
}

function buildPageHref(base: string, page: number) {
  if (page <= 1) return base
  const separator = base.includes("?") ? "&" : "?"
  return `${base}${separator}page=${page}`
}

function buildPaginationRange(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 5) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  const range: Array<number | "ellipsis"> = [1]

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  if (start > 2) {
    range.push("ellipsis")
  }

  for (let page = start; page <= end; page += 1) {
    range.push(page)
  }

  if (end < total - 1) {
    range.push("ellipsis")
  }

  range.push(total)

  return range
}

interface PaginationLinkButtonProps {
  href: string
  label: string
  disabled?: boolean
  active?: boolean
}

function PaginationLinkButton({ href, label, disabled, active }: PaginationLinkButtonProps) {
  const baseClass = cn(
    "rounded-full px-4 py-2 text-sm font-medium transition-colors",
    disabled
      ? "pointer-events-none border border-dark-border/60 bg-neutral text-dark/50"
      : "border border-dark-border bg-white text-dark hover:bg-neutral",
    active && !disabled ? "border border-dark bg-dark text-white hover:bg-dark" : null
  )

  if (disabled) {
    return <span className={baseClass}>{label}</span>
  }

  return (
    <Link className={baseClass} href={href} prefetch={false}>
      {label}
    </Link>
  )
}

export const PostsArchiveComponent: React.FC<PostsArchiveBlock & PageData> = async props => {
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

  const resolvedLimit = postsPerPage ?? 9
  const resolvedLayout = (layout ?? "grid") as ArchiveLayout
  const resolvedColumns = (columns ?? "three") as ArchiveColumns
  const shouldShowExcerpt = showExcerpt ?? true
  const shouldShowCategories = showCategories ?? true
  const shouldShowPublishedDate = showPublishedDate ?? true
  const shouldShowReadingTime = showReadingTime ?? false
  const shouldShowPagination = showPagination ?? true
  const shouldShowPageRange = showPageRange ?? true
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

  const gridClass = cn({
    "grid gap-8 md:grid-cols-2": resolvedLayout === "grid" && resolvedColumns === "two",
    "grid gap-8 md:grid-cols-2 lg:grid-cols-3": resolvedLayout === "grid" && resolvedColumns === "three",
    "grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4":
      resolvedLayout === "grid" && resolvedColumns === "four",
    "space-y-6": resolvedLayout === "list",
  })

  const appearance = appearanceFromColorScheme(sectionSettings?.colorScheme)

  return (
    <Section sectionSettings={sectionSettings} containerClassName="space-y-10">
      <div className={gridClass}>
        {posts.docs.map(post => (
          <PostCard
            key={(post as Post).id}
            post={post as Post}
            appearance={appearance as any}
            showExcerpt={shouldShowExcerpt}
            showCategories={shouldShowCategories}
            showPublishedDate={shouldShowPublishedDate}
            showReadingTime={shouldShowReadingTime}
            className={
              resolvedLayout === "list"
                ? "flex flex-col md:flex-row md:items-center md:gap-6"
                : undefined
            }
          />
        ))}
      </div>

      {shouldShowPagination && posts.totalPages > 1 ? (
        <div className="space-y-4">
          {shouldShowPageRange ? (
            <PageRange
              collection="posts"
              currentPage={posts.page}
              limit={resolvedLimit}
              totalDocs={posts.totalDocs}
            />
          ) : null}

          <nav className="flex items-center gap-2" aria-label="Pagination">
            <PaginationLinkButton
              href={buildPageHref(archiveUri, posts.page - 1)}
              disabled={posts.page <= 1}
              label="Previous"
            />

            {buildPaginationRange(posts.page, posts.totalPages).map((item, index) => {
              if (item === "ellipsis") {
                return (
                  <span
                    key={`ellipsis-${posts.page}-${posts.totalPages}-${index}`}
                    className="px-2 text-sm text-dark-600"
                  >
                    …
                  </span>
                )
              }

              const pageNumber = item as number
              return (
                <PaginationLinkButton
                  key={`page-${pageNumber}`}
                  href={buildPageHref(archiveUri, pageNumber)}
                  label={String(pageNumber)}
                  active={pageNumber === posts.page}
                />
              )
            })}

            <PaginationLinkButton
              href={buildPageHref(archiveUri, posts.page + 1)}
              disabled={posts.page >= posts.totalPages}
              label="Next"
            />
          </nav>
        </div>
      ) : null}
    </Section>
  )
}
