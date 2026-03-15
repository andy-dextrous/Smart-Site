"use client"

import type { CSSProperties } from "react"
import React, { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

import { Pagination } from "@/components/fields/pagination"
import { cn } from "@/utilities/ui"

/*************************************************************************/
/*  TYPES
/*************************************************************************/

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

type PostsArchiveResponse = {
  docs: ArchivePostItem[]
  totalDocs: number
  totalPages: number
  page: number
}

type PostsArchiveClientProps = {
  initialPosts: ArchivePostItem[]
  initialPage: number
  initialTotalDocs: number
  initialTotalPages: number
  limit: number
  offset: number
  sort: string | string[]
  categoryFilter?: string[]
  includeReadingTime: boolean
  archiveUri: string
  gridClassName: string
  controlsClassName: string
  rangeClassName: string
  cardClassName?: string
  tone: "light" | "neutral" | "dark"
  appearance: "neutral" | "light" | "dark"
  showExcerpt: boolean
  showCategories: boolean
  showPagination: boolean
  showPageRange: boolean
}

/*************************************************************************/
/*  INTERNAL HELPERS
/*************************************************************************/

function parsePageParam(value: string | null): number {
  if (!value) return 1
  const parsed = parseInt(value, 10)
  if (Number.isNaN(parsed) || parsed < 1) return 1
  return parsed
}

function getRangeText(options: {
  collectionLabel?: { singular: string; plural: string }
  currentPage: number
  limit: number
  totalDocs: number
}): string {
  const { collectionLabel, currentPage, limit, totalDocs } = options

  if (!totalDocs) {
    return "Search produced no results."
  }

  let indexStart = (currentPage - 1) * limit + 1
  if (indexStart > totalDocs) indexStart = 0

  let indexEnd = currentPage * limit
  if (indexEnd > totalDocs) indexEnd = totalDocs

  const labels = collectionLabel ?? { singular: "Post", plural: "Posts" }
  const label = totalDocs === 1 ? labels.singular : labels.plural

  return `Showing ${indexStart}${indexStart > 0 ? ` - ${indexEnd}` : ""} of ${totalDocs} ${label}`
}

function buildPostsApiUrl(options: {
  page: number
  limit: number
  offset: number
  sort: string | string[]
  categoryFilter?: string[]
  includeReadingTime: boolean
}): string {
  const params = new URLSearchParams()

  params.set("page", String(options.page))
  params.set("limit", String(options.limit))
  params.set("offset", String(options.offset))
  params.set("sort", Array.isArray(options.sort) ? options.sort.join(",") : options.sort)

  if (options.includeReadingTime) {
    params.set("readingTime", "true")
  }

  for (const category of options.categoryFilter ?? []) {
    if (category) {
      params.append("category", category)
    }
  }

  return `/api/posts?${params.toString()}`
}

/*************************************************************************/
/*  POST CARD RENDERING
/*************************************************************************/

const appearanceClassMap: Record<PostsArchiveClientProps["appearance"], string> = {
  light: "bg-white text-dark border border-dark-border",
  neutral: "bg-neutral text-dark border border-dark-border",
  dark: "bg-dark text-white border border-light-border",
}

const metaTextClassMap: Record<PostsArchiveClientProps["appearance"], string> = {
  light: "text-dark-600",
  neutral: "text-dark-600",
  dark: "text-white/70",
}

const categoryPillClassMap: Record<PostsArchiveClientProps["appearance"], string> = {
  light: "border-dark-border/70 text-dark-600",
  neutral: "border-dark-border/70 text-dark-600",
  dark: "border-light-border/70 text-white/80",
}

function PostsArchiveCard(props: {
  post: ArchivePostItem
  appearance: PostsArchiveClientProps["appearance"]
  cardClassName?: string
  showExcerpt: boolean
  showCategories: boolean
}) {
  const { post, appearance, cardClassName, showExcerpt, showCategories } = props

  const image = post.featuredImage
  const href = post.href
  const publishDate = post.publishDate
  const readingTime = post.readingTime
  const categories = showCategories ? post.categories : []

  const metaClassName = metaTextClassMap[appearance]

  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-2xl",
        appearanceClassMap[appearance],
        cardClassName
      )}
    >
      {image ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <Image
            src={image.url}
            alt={image.alt || post.title || "Post image"}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-content p-content md:p-content-lg">
        <div className="flex flex-wrap items-center gap-content-sm text-xs uppercase tracking-[0.18em]">
          {publishDate ? <span className={metaClassName}>{publishDate}</span> : null}
          {readingTime ? <span className={metaClassName}>{`${readingTime} min read`}</span> : null}
        </div>

        {categories.length > 0 ? (
          <div className="flex flex-wrap items-center gap-content-sm text-xs uppercase tracking-[0.18em]">
            {categories.map(category => (
              <span
                key={category}
                className={cn("rounded-full border px-content-sm py-content-xs", categoryPillClassMap[appearance])}
              >
                {category}
              </span>
            ))}
          </div>
        ) : null}

        <div className="flex flex-col gap-content-sm">
          {href ? (
            <Link href={href} className="text-balance text-h3 hover:text-primary">
              {post.title}
            </Link>
          ) : (
            <h3 className="text-balance text-h3">{post.title}</h3>
          )}

          {showExcerpt ? (
            <p className={cn("text-base", metaClassName)}>{post.excerpt}</p>
          ) : null}
        </div>
      </div>
    </article>
  )
}

/*************************************************************************/
/*  POSTS ARCHIVE CLIENT
/*************************************************************************/

export function PostsArchiveClient(props: PostsArchiveClientProps) {
  const {
    initialPosts,
    initialPage,
    initialTotalDocs,
    initialTotalPages,
    limit,
    offset,
    sort,
    categoryFilter,
    includeReadingTime,
    archiveUri,
    gridClassName,
    controlsClassName,
    rangeClassName,
    cardClassName,
    tone,
    appearance,
    showExcerpt,
    showCategories,
    showPagination,
    showPageRange,
  } = props

  const searchParams = useSearchParams()

  const urlPage = useMemo(() => parsePageParam(searchParams.get("page")), [searchParams])

  const [data, setData] = useState<PostsArchiveResponse>(() => ({
    docs: initialPosts,
    page: initialPage,
    totalDocs: initialTotalDocs,
    totalPages: initialTotalPages,
  }))

  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (urlPage === initialPage) {
      setData({
        docs: initialPosts,
        page: initialPage,
        totalDocs: initialTotalDocs,
        totalPages: initialTotalPages,
      })
      return
    }

    const controller = new AbortController()

    async function load() {
      setIsLoading(true)

      try {
        const url = buildPostsApiUrl({
          page: urlPage,
          limit,
          offset,
          sort,
          categoryFilter,
          includeReadingTime,
        })

        const response = await fetch(url, { signal: controller.signal })
        if (!response.ok) {
          return
        }

        const json = (await response.json()) as PostsArchiveResponse
        if (!controller.signal.aborted) {
          setData(json)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    load()

    return () => controller.abort()
  }, [
    categoryFilter,
    includeReadingTime,
    initialPage,
    initialPosts,
    initialTotalDocs,
    initialTotalPages,
    limit,
    offset,
    sort,
    urlPage,
  ])

  const rangeText = useMemo(() => {
    return getRangeText({
      currentPage: data.page,
      limit,
      totalDocs: data.totalDocs,
    })
  }, [data.page, data.totalDocs, limit])

  const shouldRenderPagination = showPagination && data.totalPages > 1

  const gridStyle = useMemo<CSSProperties>(() => {
    if (!isLoading) return {}
    return { opacity: 0.65 }
  }, [isLoading])

  return (
    <>
      <div className={gridClassName} style={gridStyle}>
        {data.docs.map(post => (
          <PostsArchiveCard
            key={post.id}
            post={post}
            appearance={appearance}
            cardClassName={cardClassName}
            showExcerpt={showExcerpt}
            showCategories={showCategories}
          />
        ))}
      </div>

      {shouldRenderPagination ? (
        <div className={controlsClassName}>
          {showPageRange ? <div className={rangeClassName}>{rangeText}</div> : null}

          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            archiveUri={archiveUri}
            colorVariant={tone}
          />
        </div>
      ) : null}
    </>
  )
}

