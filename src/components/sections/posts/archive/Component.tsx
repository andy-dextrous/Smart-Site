import type { Media, PostsArchiveBlock, Post } from "@/admin/payload/payload-types"
import type { PageData } from "@/admin/components/render-sections"
import { getPostsWithPagination } from "@/admin/data/posts"
import {
  estimatePostReadingTime,
  formatPostPublishDate,
  resolvePostCategories,
} from "@/admin/utilities/posts"
import { Section } from "@/components/fields/section"
import { PageRange } from "@/components/fields/pagination/page-range"
import { Pagination } from "@/components/fields/pagination"
import { PostCard } from "@/components/posts/post-card"
import { Suspense } from "react"
import { tv } from "tailwind-variants"
import { PostsArchiveClient } from "./client"

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

type ArchivePostItem = {
  id: string | number
  title: string
  href: string | null
  excerpt: string
  categories: string[]
  publishDate: string | null
  readingTime: number | null
  featuredImage: { url: string; alt: string | null } | null
}

function toArchivePostItem(post: Post, options: { includeCategories: boolean; includePublishedDate: boolean; includeReadingTime: boolean }): ArchivePostItem {
  const image =
    post.featuredImage && typeof post.featuredImage === "object"
      ? (post.featuredImage as Media)
      : null

  const href = post.uri || (post.slug ? `/posts/${post.slug}` : null)

  return {
    id: post.id,
    title: post.title || "",
    href,
    excerpt: post.seo?.meta?.description || "",
    categories: options.includeCategories ? resolvePostCategories(post) : [],
    publishDate: options.includePublishedDate ? formatPostPublishDate(post.publishedAt) : null,
    readingTime: options.includeReadingTime ? estimatePostReadingTime(post.content) : null,
    featuredImage:
      image && typeof image.url === "string" && image.url.length > 0
        ? { url: image.url, alt: typeof image.alt === "string" ? image.alt : null }
        : null,
  }
}

function PostsArchiveFallback(props: {
  posts: Post[]
  archiveUri: string
  limit: number
  page: number
  totalPages: number
  totalDocs: number
  gridClassName: string
  controlsClassName: string
  rangeClassName: string
  cardClassName?: string
  tone: "light" | "neutral" | "dark"
  appearance: "neutral" | "light" | "dark"
  showExcerpt: boolean
  showCategories: boolean
  showPublishedDate: boolean
  showReadingTime: boolean
  showPagination: boolean
  showPageRange: boolean
}) {
  const {
    posts,
    archiveUri,
    limit,
    page,
    totalPages,
    totalDocs,
    gridClassName,
    controlsClassName,
    rangeClassName,
    cardClassName,
    tone,
    appearance,
    showExcerpt,
    showCategories,
    showPublishedDate,
    showReadingTime,
    showPagination,
    showPageRange,
  } = props

  return (
    <>
      <div className={gridClassName}>
        {posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            appearance={appearance}
            showExcerpt={showExcerpt}
            showCategories={showCategories}
            showPublishedDate={showPublishedDate}
            showReadingTime={showReadingTime}
            className={cardClassName}
          />
        ))}
      </div>

      {showPagination && totalPages > 1 ? (
        <div className={controlsClassName}>
          {showPageRange ? (
            <PageRange
              collection="posts"
              currentPage={page}
              limit={limit}
              totalDocs={totalDocs}
              className={rangeClassName}
            />
          ) : null}

          <Pagination
            page={page}
            totalPages={totalPages}
            archiveUri={archiveUri}
            colorVariant={tone}
          />
        </div>
      ) : null}
    </>
  )
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

  const categoryIds = normalizeCategoryFilter(categoryFilter)

  const posts = await getPostsWithPagination({
    limit: resolvedLimit,
    page: 1,
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

  const archivePosts = posts.docs.map(post =>
    toArchivePostItem(post as Post, {
      includeCategories: shouldShowCategories,
      includePublishedDate: shouldShowPublishedDate,
      includeReadingTime: shouldShowReadingTime,
    })
  )

  return (
    <Section sectionSettings={sectionSettings} containerClassName={containerClassName}>
      <Suspense
        fallback={
          <PostsArchiveFallback
            posts={posts.docs as Post[]}
            archiveUri={archiveUri}
            limit={resolvedLimit}
            page={posts.page}
            totalPages={posts.totalPages}
            totalDocs={posts.totalDocs}
            gridClassName={gridClassName}
            controlsClassName={controlsClassName}
            rangeClassName={rangeClassName}
            cardClassName={cardClassName || undefined}
            tone={tone}
            appearance={appearance}
            showExcerpt={shouldShowExcerpt}
            showCategories={shouldShowCategories}
            showPublishedDate={shouldShowPublishedDate}
            showReadingTime={shouldShowReadingTime}
            showPagination={shouldShowPagination}
            showPageRange={shouldShowPageRange}
          />
        }
      >
        <PostsArchiveClient
          initialPosts={archivePosts}
          initialPage={posts.page}
          initialTotalDocs={posts.totalDocs}
          initialTotalPages={posts.totalPages}
          limit={resolvedLimit}
          offset={normalizedOffset}
          sort={normalizedSort}
          categoryFilter={categoryIds}
          includeReadingTime={shouldShowReadingTime}
          archiveUri={archiveUri}
          gridClassName={gridClassName}
          controlsClassName={controlsClassName}
          rangeClassName={rangeClassName}
          cardClassName={cardClassName || undefined}
          tone={tone}
          appearance={appearance}
          showExcerpt={shouldShowExcerpt}
          showCategories={shouldShowCategories}
          showPagination={shouldShowPagination}
          showPageRange={shouldShowPageRange}
        />
      </Suspense>
    </Section>
  )
}
