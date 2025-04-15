import { RelatedPosts } from "@/payload/blocks/related-posts/Component"
import RichText from "@/payload/components/rich-text"
import { Post } from "@/payload/payload-types"

export default function PostBody({ post }: { post: Post }) {
  return (
    <section className="flex flex-col items-center gap-4">
      <div className="container">
        {post.content && (
          <RichText
            className="mx-auto max-w-[48rem]"
            data={post.content}
            enableGutter={false}
          />
        )}
        {post.relatedPosts && post.relatedPosts.length > 0 && (
          <RelatedPosts
            className="col-span-3 col-start-1 mt-12 max-w-[52rem] grid-rows-[2fr] lg:grid lg:grid-cols-subgrid"
            docs={post.relatedPosts.filter(post => typeof post === "object")}
          />
        )}
      </div>
    </section>
  )
}
