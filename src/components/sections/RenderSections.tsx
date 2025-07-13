import { HeroPrimaryComponent } from "@/components/sections/hero-primary/Component"
import { HeroFullComponent } from "@/components/sections/hero-full/Component"
import { TextImageComponent } from "@/components/sections/text-image/Component"
import CirclesAnimationComponent from "@/components/sections/circles-animation/Component"
import { ServiceCardsListComponent } from "@/components/sections/service-cards-list/Component"
import { TestimonialsComponent } from "@/components/sections/testimonials/Component"
import { InfoGridComponent } from "@/components/sections/info-grid/Component"
import { LatestArticlesComponent } from "@/components/sections/latest-articles/Component"
import { FullwidthCtaComponent } from "@/components/sections/fullwidth-cta/Component"
import { GlobeLocationsComponent } from "@/components/sections/globe-locations/Component"
import { ContactFormComponent } from "@/components/sections/contact-form/Component"
import { CtaFormComponent } from "@/components/sections/cta-form/Component"
import { HeadingLeftContentComponent } from "@/components/sections/heading-left-content/Component"
import { SimpleTextComponent } from "@/components/sections/simple-text/Component"
import { PostHeroComponent } from "@/components/sections/post-hero/Component"
import { PostContentComponent } from "@/components/sections/post-content/Component"
import { PostsArchiveComponent } from "@/components/sections/posts-archive/Component"
import { RelatedPostsComponent } from "@/components/sections/related-posts/Component"
import React, { Fragment } from "react"

/*******************************************************/
/*  Page Data Type - Available to all sections
/*******************************************************/

export interface PageData {
  document?: any
  collection?: string
  breadcrumbs?: any[]
}

/*******************************************************/
/*  Mappings
/*******************************************************/

const sectionsMap: Record<string, React.ComponentType<any>> = {
  "hero-primary": HeroPrimaryComponent,
  "hero-full": HeroFullComponent,
  "text-image": TextImageComponent,
  "circles-animation": CirclesAnimationComponent,
  "service-cards-list": ServiceCardsListComponent,
  testimonials: TestimonialsComponent,
  "info-grid": InfoGridComponent,
  "latest-articles": LatestArticlesComponent,
  "fullwidth-cta": FullwidthCtaComponent,
  "globe-locations": GlobeLocationsComponent,
  "contact-form": ContactFormComponent,
  "cta-form": CtaFormComponent,
  "heading-left-content": HeadingLeftContentComponent,
  "simple-text": SimpleTextComponent,
  "post-hero": PostHeroComponent,
  "post-content": PostContentComponent,
  "posts-archive": PostsArchiveComponent,
  "related-posts": RelatedPostsComponent,
}

/*******************************************************/
/*  Render Component
/*
/*  Automatically passes document, collection, and breadcrumbs
/*  to all sections as optional props for dynamic content access
/*******************************************************/

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
