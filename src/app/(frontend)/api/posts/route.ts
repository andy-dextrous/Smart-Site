import type { Media, Post } from "@/admin/payload/payload-types"
import { getPostsWithPagination } from "@/admin/data/posts"
import {
  estimatePostReadingTime,
  formatPostPublishDate,
  resolvePostCategories,
} from "@/admin/utilities/posts"
import type { NextRequest } from "next/server"

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

/*************************************************************************/
/*  INTERNAL HELPERS
/*************************************************************************/

function parseInteger(value: string | null, fallback: number) {
  if (!value) return fallback
  const parsed = parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function resolveFeaturedImage(post: Post): ArchivePostItem["featuredImage"] {
  const image =
    post.featuredImage && typeof post.featuredImage === "object"
      ? (post.featuredImage as Media)
      : null

  if (!image || typeof image.url !== "string" || image.url.length === 0) {
    return null
  }

  return {
    url: image.url,
    alt: typeof image.alt === "string" ? image.alt : null,
  }
}

function toArchivePostItem(
  post: Post,
  options: { includeCategories: boolean; includePublishedDate: boolean; includeReadingTime: boolean }
): ArchivePostItem {
  const href = post.uri || (post.slug ? `/posts/${post.slug}` : null)

  return {
    id: post.id,
    title: post.title || "",
    href,
    excerpt: post.seo?.meta?.description || "",
    categories: options.includeCategories ? resolvePostCategories(post) : [],
    publishDate: options.includePublishedDate ? formatPostPublishDate(post.publishedAt) : null,
    readingTime: options.includeReadingTime ? estimatePostReadingTime(post.content) : null,
    featuredImage: resolveFeaturedImage(post),
  }
}

/*************************************************************************/
/*  POSTS API ROUTE
/*************************************************************************/

export async function GET(request: NextRequest): Promise<Response> {
  const searchParams = request.nextUrl.searchParams

  const page = Math.max(1, parseInteger(searchParams.get("page"), 1))
  const limit = Math.max(1, parseInteger(searchParams.get("limit"), 9))
  const offset = Math.max(0, parseInteger(searchParams.get("offset"), 0))
  const sort = searchParams.get("sort") ?? "-publishedAt"
  const includeReadingTime = searchParams.get("readingTime") === "true"

  const categories = searchParams
    .getAll("category")
    .map(value => value.trim())
    .filter(Boolean)

  const result = await getPostsWithPagination({
    page,
    limit,
    offset,
    sort,
    categoryFilter: categories.length ? categories : undefined,
  })

  const docs = result.docs.map(post =>
    toArchivePostItem(post as Post, {
      includeCategories: true,
      includePublishedDate: true,
      includeReadingTime,
    })
  )

  return Response.json({
    docs,
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
    page: result.page,
  })
}

