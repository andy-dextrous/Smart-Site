import { cache } from "@/lib/cache"
import type { Post } from "@/payload-types"

/*************************************************************************/
/*  GET RECENT POSTS FOR LATEST ARTICLES - MIGRATED TO UNIVERSAL CACHE
/*************************************************************************/

export async function getRecentPosts({ limit = 3 }: { limit?: number } = {}): Promise<
  Post[]
> {
  return cache.getCollection("posts", {
    limit,
    sort: "-publishedAt",
    where: {
      _status: {
        equals: "published",
      },
    },
    depth: 1,
    overrideAccess: false,
  })
}

/*************************************************************************/
/*  GET RELATED POSTS - PRIORITIZES MANUAL SELECTION, THEN FALLBACKS
/*************************************************************************/

export async function getRelatedPosts({
  document,
  limit = 3,
}: {
  document: Post
  limit?: number
}): Promise<Post[]> {
  const relatedPosts: Post[] = []
  const excludeIds = [document.id]

  /**
   * Get manually selected related posts first
   */
  const manualRelatedPosts = document.relatedPosts || []
  if (manualRelatedPosts.length > 0) {
    const manualPostIds = manualRelatedPosts
      .map((post: any) => (typeof post === "string" ? post : post.id))
      .filter(Boolean) as string[]

    const manualPosts = await cache.getCollection("posts", {
      limit: Math.min(manualPostIds.length, limit),
      where: {
        and: [
          {
            _status: {
              equals: "published",
            },
          },
          {
            id: {
              in: manualPostIds,
            },
          },
        ],
      },
      depth: 1,
      overrideAccess: false,
    })

    relatedPosts.push(...manualPosts)
    excludeIds.push(...manualPosts.map((post: any) => post.id))
  }

  /**
   * Fill remaining slots with category-based posts if needed
   */
  if (relatedPosts.length < limit) {
    const remainingNeeded = limit - relatedPosts.length
    const categories = document.categories || []

    if (categories.length > 0) {
      // Extract proper category IDs, handling both UUIDs and integers
      const categoryIds = categories
        .map((cat: any) => {
          if (typeof cat === "number") return cat
          if (typeof cat === "string") {
            // If it looks like a UUID, keep it as string; otherwise try to parse as number
            if (cat.length > 10 && cat.includes("-")) {
              return cat // UUID string
            }
            const num = parseInt(cat, 10)
            return isNaN(num) ? cat : num // Keep as string if not a number
          }
          if (cat && typeof cat === "object" && cat.id) {
            // Handle object with id property
            if (
              typeof cat.id === "string" &&
              cat.id.length > 10 &&
              cat.id.includes("-")
            ) {
              return cat.id // UUID string
            }
            const num = typeof cat.id === "number" ? cat.id : parseInt(cat.id, 10)
            return isNaN(num) ? cat.id : num
          }
          return null
        })
        .filter((id): id is string | number => id !== null)

      // Only proceed if we have valid category IDs
      if (categoryIds.length > 0) {
        const categoryPosts = await cache.getCollection("posts", {
          limit: remainingNeeded,
          sort: "-publishedAt",
          where: {
            and: [
              {
                _status: {
                  equals: "published",
                },
              },
              {
                id: {
                  not_in: excludeIds,
                },
              },
              {
                categories: {
                  in: categoryIds,
                },
              },
            ],
          },
          depth: 1,
          overrideAccess: false,
        })

        relatedPosts.push(...categoryPosts)
        excludeIds.push(...categoryPosts.map((post: any) => post.id))
      }
    }
  }

  /**
   * Fill any remaining slots with most recent posts
   */
  if (relatedPosts.length < limit) {
    const remainingNeeded = limit - relatedPosts.length

    const recentPosts = await cache.getCollection("posts", {
      limit: remainingNeeded,
      sort: "-publishedAt",
      where: {
        and: [
          {
            _status: {
              equals: "published",
            },
          },
          {
            id: {
              not_in: excludeIds,
            },
          },
        ],
      },
      depth: 1,
      overrideAccess: false,
    })

    relatedPosts.push(...recentPosts)
  }

  return relatedPosts
}

/*************************************************************************/
/*  GET POSTS WITH PAGINATION
/*************************************************************************/

interface PostsPaginationOptions {
  limit?: number
  page?: number
  categoryFilter?: string[]
  offset?: number
  sort?: string | string[]
}

export async function getPostsWithPagination({
  limit = 12,
  page = 1,
  categoryFilter,
  offset = 0,
  sort = "-publishedAt",
}: PostsPaginationOptions = {}): Promise<{
  docs: Post[]
  totalDocs: number
  totalPages: number
  page: number
}> {
  const whereConditions: any = {
    _status: {
      equals: "published",
    },
  }

  if (categoryFilter && categoryFilter.length > 0) {
    whereConditions.categories = {
      in: categoryFilter,
    }
  }

  const normalizedLimit = Math.max(limit, 1)
  const normalizedPage = Math.max(page, 1)
  const normalizedOffset = Math.max(offset, 0)

  const baseOptions = {
    limit: normalizedLimit,
    sort,
    where: whereConditions,
    depth: 1,
    overrideAccess: false,
  }

  if (normalizedOffset === 0) {
    return cache.getCollectionWithPagination("posts", {
      ...baseOptions,
      page: normalizedPage,
    })
  }

  const totalSkip = normalizedOffset + (normalizedPage - 1) * normalizedLimit
  const initialPage = Math.floor(totalSkip / normalizedLimit) + 1
  const initialSkip = totalSkip % normalizedLimit

  let remaining = normalizedLimit
  let pageCursor = initialPage
  const aggregatedDocs: Post[] = []
  let baseResult: { totalDocs: number; totalPages: number } | null = null

  while (remaining > 0) {
    const result = await cache.getCollectionWithPagination("posts", {
      ...baseOptions,
      page: pageCursor,
    })

    if (!baseResult) {
      baseResult = {
        totalDocs: result.totalDocs,
        totalPages: result.totalPages,
      }
    }

    if (!result.docs.length) {
      break
    }

    const sliceStart = pageCursor === initialPage ? initialSkip : 0
    const docsForPage = result.docs.slice(sliceStart, sliceStart + remaining)
    aggregatedDocs.push(...(docsForPage as Post[]))
    remaining -= docsForPage.length

    if (pageCursor >= result.totalPages) {
      break
    }

    pageCursor += 1
  }

  const totalAvailable = Math.max((baseResult?.totalDocs ?? 0) - normalizedOffset, 0)
  const totalPagesAfterOffset =
    totalAvailable > 0 ? Math.ceil(totalAvailable / normalizedLimit) : 0

  return {
    docs: aggregatedDocs,
    totalDocs: totalAvailable,
    totalPages: totalPagesAfterOffset,
    page: normalizedPage,
  }
}
