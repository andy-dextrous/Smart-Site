import type { Media, Post } from "@/payload-types"
import { Media as PayloadMedia } from "@/components/fields/media"
import {
  formatPostPublishDate,
  estimatePostReadingTime,
  resolvePostCategories,
} from "@/lib/posts"
import { cn } from "@/lib/ui"
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

  const categories = showCategories ? resolvePostCategories(post) : []
  const publishDate = showPublishedDate ? formatPostPublishDate(post.publishedAt) : null
  const readingTime = showReadingTime ? estimatePostReadingTime(post.content) : null

  const image =
    post.featuredImage && typeof post.featuredImage === "object"
      ? (post.featuredImage as Media)
      : null

  const href = post.uri || (post.slug ? `/posts/${post.slug}` : undefined)

  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-2xl",
        appearanceClassMap[appearance],
        className
      )}
    >
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

      <div className="gap-content p-content md:p-content-lg flex flex-1 flex-col">
        <div className="gap-content-sm flex flex-wrap items-center text-xs tracking-[0.18em] uppercase">
          {publishDate ? (
            <span className={metaTextClassMap[appearance]}>{publishDate}</span>
          ) : null}
          {readingTime ? (
            <span
              className={metaTextClassMap[appearance]}
            >{`${readingTime} min read`}</span>
          ) : null}
        </div>

        {categories.length > 0 ? (
          <div className="gap-content-sm flex flex-wrap items-center text-xs tracking-[0.18em] uppercase">
            {categories.map(category => (
              <span
                key={category}
                className={cn(
                  "px-content-sm py-content-xs rounded-full border",
                  appearance === "dark"
                    ? "border-light-border/70 text-white/80"
                    : "border-dark-border/70 text-dark-600"
                )}
              >
                {category}
              </span>
            ))}
          </div>
        ) : null}

        <div className="gap-content-sm flex flex-col">
          {href ? (
            <Link href={href} className="text-h3 hover:text-primary text-balance">
              {post.title}
            </Link>
          ) : (
            <h3 className="text-h3 text-balance">{post.title}</h3>
          )}

          {showExcerpt ? (
            <p className={cn("text-base", metaTextClassMap[appearance])}>
              {post.seo?.meta?.description || ""}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  )
}
