import type { Media as MediaType, Post, PostsHeroBlock } from "@/admin/payload/payload-types"
import type { PageData } from "@/admin/components/render-sections"
import { Section } from "@/components/fields/section"
import { Media } from "@/components/fields/media"

function resolveCategories(post: Post) {
  const categories = post.categories || []

  return categories
    .map(category => {
      if (typeof category === "object" && category !== null) {
        return "title" in category ? category.title : null
      }
      return null
    })
    .filter((value): value is string => Boolean(value))
}

function formatPublishDate(value: string | null | undefined) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function estimateReadingTime(content: Post["content"]) {
  if (!content?.root?.children) return null

  let words = 0
  const walk = (node: any) => {
    if (!node) return
    if (typeof node === "string") {
      words += node.trim().split(/\s+/).filter(Boolean).length
    } else {
      if (node.text) {
        words += node.text.trim().split(/\s+/).filter(Boolean).length
      }
      if (Array.isArray(node.children)) node.children.forEach(walk)
    }
  }

  content.root.children.forEach(walk)

  if (words === 0) return null

  return Math.max(1, Math.round(words / 200))
}

interface ExtendedPostsHeroBlock extends PostsHeroBlock {
  showCategories?: boolean | null
  showAuthor?: boolean | null
  showPublishDate?: boolean | null
  showReadingTime?: boolean | null
  showFeaturedImage?: boolean | null
}

export const PostsHeroComponent: React.FC<PostsHeroBlock & PageData> = props => {
  const {
    document,
    showCategories = true,
    showAuthor = true,
    showPublishDate = true,
    showReadingTime = true,
    showFeaturedImage = true,
    sectionSettings,
  } = props as ExtendedPostsHeroBlock & PageData

  const post = document as Post | undefined
  if (!post) {
    return null
  }

  const categories = resolveCategories(post)
  const publishDate = showPublishDate ? formatPublishDate(post.publishedAt) : null
  const readingTime = showReadingTime ? estimateReadingTime(post.content) : null
  const authors = post.populatedAuthors || []
  const primaryAuthor =
    authors.length > 0 && typeof authors[0] === "object" ? authors[0] : null

  const featuredImage =
    showFeaturedImage && post.featuredImage && typeof post.featuredImage === "object"
      ? (post.featuredImage as MediaType)
      : null

  return (
    <Section
      sectionSettings={sectionSettings}
      containerClassName="flex flex-col gap-12 lg:flex-row lg:items-center"
    >
      <div className="flex-1 space-y-6">
        {categories.length > 0 && showCategories ? (
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-dark-600">
            {categories.map(category => (
              <span key={category} className="rounded-full border border-dark-border px-3 py-1">
                {category}
              </span>
            ))}
          </div>
        ) : null}

        <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-6 text-sm text-dark-600">
          {publishDate ? <span>Published {publishDate}</span> : null}
          {showAuthor && primaryAuthor ? (
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
          <p className="max-w-3xl text-lg leading-relaxed text-dark-600">
            {post.seo?.meta?.description}
          </p>
        ) : null}
      </div>

      {featuredImage ? (
        <div className="relative aspect-[3/2] w-full max-w-xl overflow-hidden rounded-2xl border border-dark-border bg-neutral">
          <Media resource={featuredImage} fill imgClassName="object-cover" />
        </div>
      ) : null}
    </Section>
  )
}
