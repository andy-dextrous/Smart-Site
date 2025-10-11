import type { PostsRelatedBlock, Post } from "@/admin/payload/payload-types"
import type { PageData } from "@/admin/components/render-sections"
import { getRelatedPosts } from "@/admin/data/posts"
import { Section } from "@/components/fields/section"
import { PostCard } from "@/components/posts/post-card"

function appearanceFromColorScheme(colorScheme?: string | null) {
  if (colorScheme === "dark") return "dark"
  if (colorScheme === "light") return "light"
  return "neutral"
}

export const PostsRelatedComponent: React.FC<PostsRelatedBlock & PageData> = async props => {
  const {
    maxPosts = 3,
    document,
    sectionSettings,
  } = props

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

  const appearance = appearanceFromColorScheme(sectionSettings?.colorScheme)

  return (
    <Section sectionSettings={sectionSettings} containerClassName="space-y-10">
      <div className="grid gap-6 md:grid-cols-3">
        {relatedPosts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            appearance={appearance as any}
            showExcerpt={true}
            showCategories={true}
            showPublishedDate={true}
          />
        ))}
      </div>
    </Section>
  )
}
