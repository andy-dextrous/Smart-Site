import type { Post, PostsHeroBlock } from "@/payload-types"
import type { PageData } from "@/website/rendering/render-sections"
import { parseHeadingGradient } from "@/components/heading-gradient"
import { Section } from "@/components/fields/section"
import { Media } from "@/components/fields/media"
import {
  formatPostPublishDate,
  estimatePostReadingTime,
  resolvePostCategories,
} from "@/utilities/posts"
import { tv } from "tailwind-variants"

const postsHeroVariants = tv({
  slots: {
    section: "relative isolate overflow-hidden",
    content: "relative z-10 w-full",
    wrapper: "gap-content flex flex-col",
    copy: "gap-content-sm flex flex-col text-pretty",
    badges:
      "gap-content-sm flex flex-wrap items-center text-xs tracking-widest uppercase",
    badge: "px-content-sm py-content-xs rounded-full border",
    heading: "text-balance",
    meta: "gap-content flex flex-wrap items-center text-sm",
    excerpt: "max-w-3xl text-lg",
    media:
      "border-dark-border bg-neutral relative aspect-[3/2] w-full max-w-xl overflow-hidden rounded-2xl border",
  },
  variants: {
    size: {
      full: {
        wrapper: "min-h-[100dvh] justify-center",
      },
      large: {
        wrapper: "min-h-[70dvh] justify-center",
      },
      medium: {
        wrapper: "min-h-[60dvh] justify-center",
      },
      small: {
        wrapper: "gap-content py-section-md justify-center",
      },
    },
    alignment: {
      left: {},
      center: {
        wrapper: "items-center text-center",
        copy: "items-center text-center",
        badges: "justify-center",
        meta: "justify-center",
        excerpt: "mx-auto text-center",
      },
    },
    tone: {
      light: {
        badges: "text-dark-600",
        badge: "border-dark-border text-dark-600",
        meta: "text-dark-600",
        excerpt: "text-dark-600",
      },
      neutral: {
        badges: "text-dark-600",
        badge: "border-dark-border text-dark-600",
        meta: "text-dark-600",
        excerpt: "text-dark-600",
      },
      dark: {
        section: "text-white",
        badges: "text-white/80",
        badge: "border-white/30 text-white",
        meta: "text-white/80",
        excerpt: "text-white/70",
      },
    },
    mediaPresence: {
      with: {},
      without: {
        wrapper: "lg:max-w-4xl",
        copy: "lg:max-w-4xl",
      },
    },
  },
  compoundVariants: [
    {
      mediaPresence: "with",
      class: {
        wrapper: "lg:gap-grid lg:flex-row lg:items-center",
        copy: "lg:flex-1",
        media: "lg:flex-1",
      },
    },
  ],
  defaultVariants: {
    size: "large",
    alignment: "left",
    tone: "light",
    mediaPresence: "with",
  },
})

export function PostsHeroComponent(props: PostsHeroBlock & PageData) {
  const {
    document,
    sectionSettings,
    showCategories,
    showAuthor,
    showPublishDate,
    showReadingTime,
    showFeaturedImage,
  } = props

  const post = document as Post | undefined
  if (!post) {
    return null
  }

  const parsedTitle = parseHeadingGradient(post.title) ?? post.title

  const showCategoryBadges = showCategories !== false
  const showAuthorName = showAuthor !== false
  const showDate = showPublishDate !== false
  const showReadTime = showReadingTime !== false
  const showImage = showFeaturedImage !== false

  const categories = showCategoryBadges ? resolvePostCategories(post) : []
  const publishDate = showDate ? formatPostPublishDate(post.publishedAt) : null
  const readingTime = showReadTime ? estimatePostReadingTime(post.content) : null
  const authors = post.populatedAuthors || []
  const primaryAuthor =
    showAuthorName && authors.length > 0 && typeof authors[0] === "object"
      ? authors[0]
      : null

  const rawFeaturedImage = showImage ? post.featuredImage : null
  const hasFeaturedImage = Boolean(
    rawFeaturedImage && typeof rawFeaturedImage === "object"
  )

  const tone =
    sectionSettings?.colorScheme === "dark"
      ? "dark"
      : sectionSettings?.colorScheme === "neutral"
        ? "neutral"
        : "light"

  const {
    section,
    content,
    wrapper,
    copy,
    badges,
    badge,
    heading,
    meta,
    excerpt,
    media: mediaSlot,
  } = postsHeroVariants({
    size: "large",
    alignment: "left",
    tone,
    mediaPresence: hasFeaturedImage ? "with" : "without",
  })

  const sectionClassName = section()
  const contentClassName = content()
  const wrapperClassName = wrapper()
  const copyClassName = copy()
  const badgesClassName = badges()
  const badgeClassName = badge()
  const headingClassName = heading()
  const metaClassName = meta()
  const excerptClassName = excerpt()
  const mediaClassName = mediaSlot()

  return (
    <Section sectionSettings={sectionSettings} className={sectionClassName}>
      <div className={contentClassName}>
        <div
          className={wrapperClassName}
          data-animate="fade-up"
          data-animate-distance="24"
          data-animate-stagger="0.1"
          data-animate-target="[data-animate-child]"
        >
          <div className={copyClassName}>
            {categories.length > 0 ? (
              <div className={badgesClassName} data-animate-child>
                {categories.map(category => (
                  <span key={category} className={badgeClassName}>
                    {category}
                  </span>
                ))}
              </div>
            ) : null}

            <h1 className={headingClassName} data-animate-child>
              {parsedTitle}
            </h1>

            <div className={metaClassName} data-animate-child>
              {publishDate ? <span>Published {publishDate}</span> : null}
              {primaryAuthor ? (
                <span>
                  By{" "}
                  {"name" in primaryAuthor && primaryAuthor?.name
                    ? primaryAuthor.name
                    : "Unknown author"}
                </span>
              ) : null}
              {readingTime ? <span>{readingTime} min read</span> : null}
            </div>

            {post.seo?.meta?.description ? (
              <p className={excerptClassName} data-animate-child>
                {post.seo?.meta?.description}
              </p>
            ) : null}
          </div>

          {hasFeaturedImage ? (
            <div className={mediaClassName} data-animate-child>
              <Media resource={rawFeaturedImage} fill imgClassName="object-cover" />
            </div>
          ) : null}
        </div>
      </div>
    </Section>
  )
}
