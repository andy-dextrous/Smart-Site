import { SectionIntro } from "@/components/layout/section-intro"
import { RelatedPosts as RelatedPostsBlock } from "@/admin/payload/blocks/related-posts/Component"
import { getRelatedPosts } from "@/admin/lib/data/posts"
import type { RelatedPostsBlock as RelatedPostsBlockType } from "@/admin/payload/payload-types"
import { PageData } from "@/admin/components/render-sections"

/*************************************************************************/
/*  RELATED POSTS SECTION COMPONENT
/*************************************************************************/

export const RelatedPostsComponent: React.FC<
  RelatedPostsBlockType & PageData
> = async props => {
  const { heading, description, document, maxPosts = 3 } = props

  if (!document) {
    return (
      <section className="bg-dark side-border-light flicker-mask-top border-light-border border-t py-16">
        <div className="container">
          <p className="text-white">Current post not found</p>
        </div>
      </section>
    )
  }

  const relatedPosts =
    (await getRelatedPosts({
      document,
      limit: maxPosts || 3,
    })) || []

  if (relatedPosts.length === 0) {
    return null
  }

  return (
    <section className="bg-dark side-border-light flicker-mask-top border-light-border border-t">
      <SectionIntro
        heading={heading || undefined}
        description={description || undefined}
        headingClassName="text-white"
      />

      <RelatedPostsBlock posts={relatedPosts} />
    </section>
  )
}
