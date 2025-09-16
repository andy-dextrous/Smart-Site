import RichText from "@/components/fields/rich-text"
import type { Post } from "@/admin/payload/payload-types"

/*************************************************************************/
/*  POST BODY - MINIMAL SECTION
/*  Renders the current post's title and content.
/*************************************************************************/

export const PostBodyComponent: React.FC<{
  document?: Post
}> = ({ document }) => {
  const post = document as Post | undefined
  if (!post) return null

  return (
    <section className="bg-white">
      <div className="container-sm">
        {post.title && (
          <h1 className="mb-6 text-2xl font-semibold text-zinc-900">{post.title}</h1>
        )}
        {post.content && (
          <div className="prose mx-auto max-w-3xl">
            <RichText data={post.content} variant="prose" />
          </div>
        )}
      </div>
    </section>
  )}

