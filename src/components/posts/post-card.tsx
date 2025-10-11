import type { Media, Post } from "@/admin/payload/payload-types"
import { Media as PayloadMedia } from "@/components/fields/media"
import { cn } from "@/utilities/ui"
import Link from "next/link"

type PostCardAppearance = "light" | "dark" | "neutral"

export interface PostCardProps {
  post: Post
  appearance?: PostCardAppearance
  className?: string
  showExcerpt?: boolean
  showCategories?: boolean
  showPublishedDate?: boolean
  showReadingTime?: boolean
}

const appearanceClassMap: Record<PostCardAppearance, string> = {
  light: "bg-white text-dark border border-dark-border",
  neutral: "bg-neutral text-dark border border-dark-border",
  dark: "bg-dark text-white border border-light-border",
}

const metaTextClassMap: Record<PostCardAppearance, string> = {
  light: "text-dark-600",
  neutral: "text-dark-600",
  dark: "text-white/70",
}

function resolveCategories(post: Post): string[] {
  const categories = post.categories || []

  return categories
    .map(category => {
      if (typeof category === "object" && category !== null) {
        return "title" in category && typeof category.title === "string"
          ? category.title
          : null
      }

      return null
    })
    .filter((title): title is string => Boolean(title))
}

function formatPublishDate(value: string | null | undefined): string | null {
  if (!value) {
    return null
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return null
  }

  return parsedDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

function estimateReadingTime(content: Post["content"]): number | null {
  if (!content?.root?.children) {
    return null
  }

  let wordCount = 0

  const walk = (node: any) => {
    if (!node) return

    if (typeof node === "string") {
      wordCount += node.trim().split(/\s+/).filter(Boolean).length
      return
    }

    if (node.text) {
      wordCount += node.text.trim().split(/\s+/).filter(Boolean).length
    }

    if (Array.isArray(node.children)) {
      node.children.forEach(walk)
    }
  }

  content.root.children.forEach(walk)

  if (wordCount === 0) {
    return null
  }

  const wordsPerMinute = 200
  return Math.max(1, Math.round(wordCount / wordsPerMinute))
}

export function PostCard(props: PostCardProps) {
  const {
    post,
    appearance = "neutral",
    className,
    showExcerpt = true,
    showCategories = true,
    showPublishedDate = true,
    showReadingTime = false,
  } = props

  const categories = showCategories ? resolveCategories(post) : []
  const publishDate = showPublishedDate ? formatPublishDate(post.publishedAt) : null
  const readingTime = showReadingTime ? estimateReadingTime(post.content) : null

  const image =
    post.featuredImage && typeof post.featuredImage === "object"
      ? (post.featuredImage as Media)
      : null

  const href = post.uri || (post.slug ? `/posts/${post.slug}` : undefined)

  return (
    <article className={cn("flex h-full flex-col overflow-hidden rounded-2xl", appearanceClassMap[appearance], className)}>
      {image ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <PayloadMedia
            resource={image}
            alt={image.alt || post.title || "Post image"}
            fill
            imgClassName="object-cover"
          />
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-4 p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em]">
          {publishDate ? (
            <span className={metaTextClassMap[appearance]}>{publishDate}</span>
          ) : null}
          {readingTime ? (
            <span className={metaTextClassMap[appearance]}>{`${readingTime} min read`}</span>
          ) : null}
        </div>

        {categories.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.18em]">
            {categories.map(category => (
              <span
                key={category}
                className={cn(
                  "rounded-full border px-3 py-1",
                  appearance === "dark" ? "border-light-border/70 text-white/80" : "border-dark-border/70 text-dark-600"
                )}
              >
                {category}
              </span>
            ))}
          </div>
        ) : null}

        <div className="space-y-3">
          {href ? (
            <Link href={href} className="text-balance text-2xl font-semibold leading-tight hover:text-primary">
              {post.title}
            </Link>
          ) : (
            <h3 className="text-balance text-2xl font-semibold leading-tight">{post.title}</h3>
          )}

          {showExcerpt ? (
            <p className={cn("text-base leading-relaxed", metaTextClassMap[appearance])}>
              {post.seo?.meta?.description || ""}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  )
}
