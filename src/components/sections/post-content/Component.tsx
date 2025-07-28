import RichText from "@/admin/payload/components/frontend/rich-text"
import type { PostContentBlock } from "@/admin/payload/payload-types"
import { PostAuthorInfo } from "@/components/posts/post-author-info"
import { DocumentBreadcrumbs } from "@/components/ui/breadcrumbs"
import { cn } from "@/utilities/ui"
import { PageData } from "@/admin/components/render-sections"

/*************************************************************************/
/*  POST CONTENT SECTION COMPONENT
/*************************************************************************/

export const PostContentComponent: React.FC<PostContentBlock & PageData> = props => {
  const {
    document,
    breadcrumbs,
    showBreadcrumbs = true,
    showAuthorInfo = true,
    proseSize = "xl",
  } = props

  // Use document (from template context) as the post data
  const postData = document

  if (!postData) {
    return (
      <section className="bg-dark border-light-border py-16">
        <div className="container-sm">
          <p className="text-white">Post not found</p>
        </div>
      </section>
    )
  }

  // Use fixed prose classes to match original
  const proseClasses = cn(
    "prose prose-xl prose-white gradient-headings !max-w-none",
    `lg:prose-${proseSize}`
  )

  return (
    <section className="bg-dark border-light-border side-border-light z-50 border-t">
      <div className="container-sm">
        {/* Breadcrumbs */}
        {showBreadcrumbs && breadcrumbs && (
          <DocumentBreadcrumbs document={{ breadcrumbs }} />
        )}

        {/* Post Content */}
        {postData.content && (
          <RichText
            data={postData.content}
            className={proseClasses}
            enableGutter={false}
            textColor="white"
          />
        )}

        {/* Author Info */}
        {showAuthorInfo && <PostAuthorInfo post={postData} />}
      </div>
    </section>
  )
}
