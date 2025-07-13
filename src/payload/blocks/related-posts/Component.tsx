import { PostCard } from "@/components/posts/post-card"
import type { Post } from "@/payload/payload-types"
import { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical"
import clsx from "clsx"
import React from "react"

/*************************************************************************/
/*  RELATED POSTS COMPONENT
/*************************************************************************/

export type RelatedPostsProps = {
  className?: string
  posts?: Post[]
  introContent?: SerializedEditorState
}

export const RelatedPosts: React.FC<RelatedPostsProps> = props => {
  const { className, posts } = props

  return (
    <div className={clsx("container-md", className)}>
      <div className="grid grid-cols-1 gap-0 md:grid-cols-2 md:gap-8">
        {posts?.map((post, index) => {
          if (typeof post === "string") return null

          return (
            <PostCard
              key={index}
              post={post}
              className="border-x-none border-y md:border-x"
            />
          )
        })}
      </div>
    </div>
  )
}
