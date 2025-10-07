import React, { Fragment } from "react"
import { sectionsMap } from "@/components/sections/sections-map"
import { sanitizePayloadData } from "@/admin/utilities/sanitize-payload-data"

/*************************************************************************/
/*  PAGE DATA TYPE - AVAILABLE TO ALL SECTIONS
/*************************************************************************/

export interface PageData {
  document?: any
  collection?: string
  breadcrumbs?: any[]
  searchParams?: { [key: string]: string | string[] | undefined }
  params?: { uri?: string[] }
}

/*************************************************************************/
/*  RENDER SECTIONS COMPONENT
/*
/*  Async server component that uses dynamic imports based on importMap paths
/*  Automatically passes document, collection, and breadcrumbs
/*  to all sections as optional props for dynamic content access
/*************************************************************************/

export function RenderSections(props: { sections: any[] } & PageData) {
  const { sections, document, collection, breadcrumbs, searchParams, params } = props

  const hasSections = sections && Array.isArray(sections) && sections.length > 0

  if (hasSections) {
    return (
      <Fragment>
        {sections.map((section, index) => {
          const { blockType } = section

          if (blockType && blockType in sectionsMap) {
            const Section = sectionsMap[blockType]

            if (Section) {
              const sectionProps = sanitizePayloadData({
                ...section,
                document,
                collection,
                breadcrumbs,
                searchParams,
                params,
              })

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
