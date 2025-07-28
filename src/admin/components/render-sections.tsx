import React, { Fragment } from "react"
import { sectionsMap } from "@/components/sections/sections-map"

/*************************************************************************/
/*  PAGE DATA TYPE - AVAILABLE TO ALL SECTIONS
/*************************************************************************/

export interface PageData {
  document?: any
  collection?: string
  breadcrumbs?: any[]
}

/*************************************************************************/
/*  RENDER SECTIONS COMPONENT
/*
/*  Async server component that uses dynamic imports based on importMap paths
/*  Automatically passes document, collection, and breadcrumbs
/*  to all sections as optional props for dynamic content access
/*************************************************************************/

export const RenderSections: React.FC<
  {
    sections: any[]
  } & PageData
> = props => {
  const { sections, document, collection, breadcrumbs } = props

  const hasSections = sections && Array.isArray(sections) && sections.length > 0

  if (hasSections) {
    return (
      <Fragment>
        {sections.map((section, index) => {
          const { blockType } = section

          if (blockType && blockType in sectionsMap) {
            const Section = sectionsMap[blockType]

            if (Section) {
              // Pass document, collection, and breadcrumbs to ALL sections as optional props
              const sectionProps = {
                ...section,
                document,
                collection,
                breadcrumbs,
              }

              return <Section {...sectionProps} key={index} />
            }
          }
          return null
        })}
      </Fragment>
    )
  }

  return null
}
