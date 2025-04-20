import { HeroPrimaryComponent } from "@/components/sections/hero-primary/Component"
import { TextImageComponent } from "@/components/sections/text-image/Component"
import React, { Fragment } from "react"

/*******************************************************/
/*  Mappings
/*******************************************************/

const sectionsMap: Record<string, React.ComponentType<any>> = {
  "hero-primary": HeroPrimaryComponent,
  "text-image": TextImageComponent,
}

/*******************************************************/
/*  Render Component
/*******************************************************/

export const RenderSections: React.FC<{
  sections: any[]
}> = props => {
  const { sections } = props

  const hasSections = sections && Array.isArray(sections) && sections.length > 0

  if (hasSections) {
    return (
      <Fragment>
        {sections.map((section, index) => {
          const { blockType } = section

          if (blockType && blockType in sectionsMap) {
            const Section = sectionsMap[blockType]

            if (Section) {
              return <Section {...section} key={index} />
            }
          }
          return null
        })}
      </Fragment>
    )
  }

  return null
}
