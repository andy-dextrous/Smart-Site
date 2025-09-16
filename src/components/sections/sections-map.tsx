import { HeroSimpleComponent } from "@/components/sections/hero-simple/Component"
import { ContentComponent } from "@/components/sections/content/Component"
import { ContactFormSimpleComponent } from "@/components/sections/contact-form-simple/Component"
import { PostsListComponent } from "@/components/sections/posts-list/Component"
import { PostBodyComponent } from "@/components/sections/post-body/Component"
import { PostHeroMinimalComponent } from "@/components/sections/post-hero-minimal/Component"
import { PostContentMinimalComponent } from "@/components/sections/post-content-minimal/Component"
import { RelatedPostsMinimalComponent } from "@/components/sections/related-posts-minimal/Component"
import React from "react"

/*************************************************************************/
/*  SECTIONS MAP - CLIENT BOUNDARY
/*
/*  Maps section block types to their React components
/*  This file exists in client space to enable direct imports
/*************************************************************************/

export const sectionsMap: Record<string, React.ComponentType<any>> = {
  "hero-simple": HeroSimpleComponent,
  "content": ContentComponent,
  "contact-form-simple": ContactFormSimpleComponent,
  "posts-list": PostsListComponent,
  "post-body": PostBodyComponent,
  "post-hero-minimal": PostHeroMinimalComponent,
  "post-content-minimal": PostContentMinimalComponent,
  "related-posts-minimal": RelatedPostsMinimalComponent,
}
