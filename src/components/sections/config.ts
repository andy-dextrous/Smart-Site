/*************************************************************************/
/*  UNIFIED SECTIONS CONFIG
/*
/*  Provides both Payload block configs AND component import paths
/*  Admin gets sectionBlocks, RenderSections gets importMap
/*************************************************************************/

import { Content } from "@/components/sections/content/config"
import { Hero } from "@/components/sections/hero/config"
import { ContactForm } from "@/components/sections/contact-form/config"
import { PostsArchive } from "@/components/sections/posts/archive/config"
import { PostsRelated } from "@/components/sections/posts/related/config"
import { PostsHero } from "@/components/sections/posts/hero/config"
import { PostsContent } from "@/components/sections/posts/content/config"

export const sections = {
  sectionBlocks: [
    Hero,
    Content,
    ContactForm,
    PostsArchive,
    PostsHero,
    PostsContent,
    PostsRelated,
  ],
}
