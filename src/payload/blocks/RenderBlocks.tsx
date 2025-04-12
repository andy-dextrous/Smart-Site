import React, { Fragment } from "react"
import { FormBlock } from "@/payload/blocks/form/component"
import { MediaBlock } from "@/payload/blocks/media/Component"
import { CodeBlock } from "./code/Component"
import { RelatedPosts } from "./related-posts/Component"

export const RenderBlocks: React.FC<{
  blocks: any[]
}> = props => {
  const { blocks } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  const blocksMap: Record<string, React.ComponentType<any>> = {
    formBlock: FormBlock,
    mediaBlock: MediaBlock,
    codeBlock: CodeBlock,
    relatedPostsBlock: RelatedPosts,
  }

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block, index) => {
          const { blockType } = block

          if (blockType && blockType in blocksMap) {
            const Block = blocksMap[blockType]

            if (Block) {
              return (
                <div key={index}>
                  <Block {...block} disableInnerContainer />
                </div>
              )
            }
          }
          return null
        })}
      </Fragment>
    )
  }

  return null
}
