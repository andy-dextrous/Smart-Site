/*************************************************************************/
/*  UNIFIED SECTIONS CONFIG
/*
/*  Provides both Payload block configs AND component import paths
/*  Admin gets sectionBlocks, RenderSections gets importMap
/*************************************************************************/

import { HeroSimple } from "@/components/sections/hero-simple/config"
import { Content } from "@/components/sections/content/config"
import { ContactFormSimple } from "@/components/sections/contact-form-simple/config"
import { PostsList } from "@/components/sections/posts-list/config"
import { PostBody } from "@/components/sections/post-body/config"
import { PostHeroMinimal } from "@/components/sections/post-hero-minimal/config"
import { PostContentMinimal } from "@/components/sections/post-content-minimal/config"
import { RelatedPostsMinimal } from "@/components/sections/related-posts-minimal/config"

export const sections = {
  sectionBlocks: [
    HeroSimple,
    Content,
    ContactFormSimple,
    PostsList,
    PostBody,
    PostHeroMinimal,
    PostContentMinimal,
    RelatedPostsMinimal,
  ],
}
