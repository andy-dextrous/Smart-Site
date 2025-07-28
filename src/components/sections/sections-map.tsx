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
import React from "react"

/*************************************************************************/
/*  SECTIONS MAP - CLIENT BOUNDARY
/*
/*  Maps section block types to their React components
/*  This file exists in client space to enable direct imports
/*************************************************************************/

export const sectionsMap: Record<string, React.ComponentType<any>> = {
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