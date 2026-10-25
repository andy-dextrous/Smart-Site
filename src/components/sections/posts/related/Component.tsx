import type { PostsRelatedBlock, Post } from "@/payload-types"
import type { PageData } from "@/lib/rendering/render-sections"
import { getRelatedPosts } from "@/lib/data/posts"
import { Section } from "@/components/fields/section"
import { PostCard } from "@/components/posts/post-card"
import { tv } from "tailwind-variants"

const relatedVariants = tv({
  slots: {
    container: "gap-content-lg flex flex-col",
    grid: "gap-grid grid md:grid-cols-3",
  },
})

function resolveAppearance(colorScheme?: string | null) {
  if (colorScheme === "dark") return "dark"
  if (colorScheme === "light") return "light"
  return "neutral"
}

export async function PostsRelatedComponent(props: PostsRelatedBlock & PageData) {
  const { maxPosts = 3, document, sectionSettings } = props

  if (!document) {
    return null
  }

  const relatedPosts = await getRelatedPosts({
    document: document as Post,
    limit: maxPosts || 3,
  })

  if (!relatedPosts || relatedPosts.length === 0) {
    return null
  }

  const appearance = resolveAppearance(sectionSettings?.colorScheme)

  const { container, grid } = relatedVariants()
  const containerClassName = container()
  const gridClassName = grid()

  return (
    <Section sectionSettings={sectionSettings} containerClassName={containerClassName}>
      <div className={gridClassName}>
        {relatedPosts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            appearance={appearance}
            showExcerpt
            showCategories
            showPublishedDate
          />
        ))}
      </div>
    </Section>
  )
}
