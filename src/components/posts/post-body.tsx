import { RelatedPosts } from "@/components/blocks/related-posts/Component"
import RichText from "@/components/fields/rich-text"
import { Post } from "@/admin/payload/payload-types"
import { SectionIntro } from "../fields/section-intro"
import { PostAuthorInfo } from "./post-author-info"
import { DocumentBreadcrumbs } from "@/components/ui/breadcrumbs"
import { BreadcrumbItem } from "@/admin/routing/uri-engine"

/*************************************************************************/
/*  POST BODY COMPONENT
/*************************************************************************/

export default function PostBody({
  post,
  relatedPosts,
}: {
  post: Post & {
    breadcrumbs?: BreadcrumbItem[]
  }
  relatedPosts?: Post[]
}) {
  return (
    <article>
      <section className="bg-dark border-light-border side-border-light z-50 translate-y-[-3px] border-t">
        <div className="container-sm">
          <DocumentBreadcrumbs document={post} />
          {post.content && (
            <RichText
              data={post.content}
              className="prose prose-xl lg:prose-2xl prose-white gradient-headings !max-w-none"
              enableGutter={false}
              textColor="white"
            />
          )}
          <PostAuthorInfo post={post} />
        </div>
      </section>
      {relatedPosts && relatedPosts.length > 0 && (
        <section className="bg-dark side-border-light flicker-mask-top border-light-border border-t">
          <SectionIntro
            heading="<span>Related</span> Posts"
            headingClassName="text-white"
          />
          <RelatedPosts posts={relatedPosts} />
        </section>
      )}
    </article>
  )
}
