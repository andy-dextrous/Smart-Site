import type { LatestArticlesBlock } from "@/payload/payload-types"
import { SectionCta } from "@/components/layout/section-cta"
import { SectionIntro } from "@/components/layout/section-intro"
import { getRecentPosts } from "@/lib/data/posts"
import { PostCard } from "@/components/posts/post-card"

/*************************************************************************/
/*  LATEST ARTICLES COMPONENT
/*************************************************************************/

export const LatestArticlesComponent: React.FC<LatestArticlesBlock> = async props => {
  const { heading, description, text, button } = props

  // Load the most recent 3 posts from CMS
  const posts = await getRecentPosts()

  return (
    <section className="bg-dark side-border-light flicker-mask-top">
      <SectionIntro
        heading={heading || undefined}
        description={description}
        headingClassName="text-white"
        descriptionClassName="font-light text-white"
      />
      <div className="border-dark-border w-full border-t">
        <div className="py-section-md md:container-md">
          <div className="grid grid-cols-1 gap-0 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                className="border-x-none border-y md:border-x"
              />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-section-x">
        <SectionCta text={text} button={button} containerClassName="text-white" />
      </div>
    </section>
  )
}
