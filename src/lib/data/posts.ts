import { cache } from "@/lib/cache"
import type { Post } from "@/payload/payload-types"

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
      // Extract proper category IDs, handling both objects and raw IDs
      const categoryIds = categories
        .map((cat: any) => {
          if (typeof cat === "number") return cat
          if (typeof cat === "string") {
            const num = parseInt(cat, 10)
            return isNaN(num) ? null : num
          }
          if (cat && typeof cat === "object" && cat.id) {
            const num = typeof cat.id === "number" ? cat.id : parseInt(cat.id, 10)
            return isNaN(num) ? null : num
          }
          return null
        })
        .filter((id): id is number => id !== null && !isNaN(id))

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

export async function getPostsWithPagination({
  limit = 12,
  page = 1,
  categoryFilter,
}: {
  limit?: number
  page?: number
  categoryFilter?: string[]
} = {}): Promise<{
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

  return cache.getCollectionWithPagination("posts", {
    limit,
    page,
    sort: "-publishedAt",
    where: whereConditions,
    depth: 1,
    overrideAccess: false,
  })
}
