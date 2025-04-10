import React, { Fragment } from "react"
import { HeroPrimaryBlock } from "@/components/sections/hero-primary/Component"

const blockComponents: Record<string, React.ComponentType<any>> = {
  "hero-primary": HeroPrimaryBlock,
}

export const RenderBlocks: React.FC<{
  blocks: any[]
}> = props => {
  const { blocks } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block, index) => {
          const { blockType } = block

          if (blockType && blockType in blockComponents) {
            const Block = blockComponents[blockType]

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
