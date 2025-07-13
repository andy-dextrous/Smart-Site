import type { Payload } from "payload"
import type { Page } from "@/payload/payload-types"
import { downloadImages, type ImageSet } from "../utils/image-downloader"
import { createRichText, paragraph } from "@/utilities/rich-text-builder"

/*************************************************************************/
/*  HOME PAGE IMAGES
/*************************************************************************/

const images: ImageSet = {
  hero: {
    url: "https://images.unsplash.com/photo-1705579605556-c0ebe229b5f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
    alt: "Smart AI-powered website platform interface",
    caption: "Smart Site AI-native platform transforming websites into business partners",
    filename: "home-hero.jpg",
  },
}

/*************************************************************************/
/*  HOME PAGE DATA
/*************************************************************************/

export const homePage = async (
  payload: Payload,
  context?: any
): Promise<Omit<Page, "updatedAt" | "id" | "createdAt">> => {
  // Download images specific to this page
  const media = await downloadImages(payload, images, context)

  return {
    title: "Home",
    slug: "home",
    _status: "published",
    sections: [
      {
        blockType: "hero-primary",
        heading: "Websites That Grow Your Business",
        content:
          "Smart Site transform your digital presence into a growth engine. We combine the power of AI with modern web architecture to create websites that don't just look good - they actively grow your business.",
        usp: "Smart Site bridges the gap between static websites and intelligent business automation, integrating AI-powered content creation, SEO optimization, and marketing workflows to drive measurable growth and sustained engagement.",
        backgroundImage: media.hero.id,
        buttons: [
          {
            button: {
              link: {
                type: "custom",
                newTab: false,
                url: "/get-started",
                label: "Start Building Smart",
              },
            },
          },
          {
            button: {
              link: {
                type: "custom",
                newTab: false,
                url: "/demo",
                label: "Watch Demo",
              },
            },
          },
        ],
        blockName: "Smart Site Hero",
      },
      {
        blockType: "circles-animation",
        title: "Bridging Vision & <span>Execution</span>",
        description: createRichText([
          paragraph(
            "Many businesses build beautiful websites that just sit there, missing opportunities for growth. Smart Site transforms static websites into intelligent business partners that actively create content, optimize performance, and drive measurable results through AI-powered automation."
          ),
        ]),
        leftCircleWords: [{ word: "Content" }, { word: "SEO" }, { word: "Growth" }],
        rightCircleWords: [
          { word: "Automation" },
          { word: "Intelligence" },
          { word: "Analytics" },
        ],
        bottomText: "AI-Native Transformation",
        blockName: "Bridging Vision & Execution",
      },
      {
        blockType: "service-cards-list",
        heading: "Platform <span>Capabilities</span>",
        description: createRichText([
          paragraph(
            "From AI-powered content creation to automated marketing workflows, our platform transforms static websites into intelligent business partners that actively drive growth and engagement."
          ),
        ]),
        text: "Ready to transform your website? Let's build something intelligent together",
        button: {
          variant: "default",
          size: "lg",
          layout: "default",
          icon: false,
          link: {
            type: "custom",
            newTab: false,
            url: "/services",
            label: "Explore All Features",
          },
        },
        blockName: "Platform Capabilities",
      },
      {
        blockType: "latest-articles",
        heading: "Latest <span>Insights</span>",
        description: createRichText([
          paragraph(
            "Stay ahead with actionable insights on AI-powered websites, intelligent business automation, and the future of web platforms."
          ),
        ]),
        text: "Explore more insights on AI-native web development",
        button: {
          variant: "default",
          size: "lg",
          layout: "default",
          icon: false,
          link: {
            type: "custom",
            newTab: false,
            url: "/insights",
            label: "View All Articles",
          },
        },
        blockName: "Latest Articles",
      },
    ],
    seo: {
      meta: {
        title: "Smart Site | AI-Native Website Platform",
        description:
          "Transform your website into an intelligent business partner with Smart Site's AI-native platform. Create, optimize, and grow your business automatically.",
        focusKeywords:
          "AI website platform, intelligent websites, AI-powered web development, website automation, smart website builder, AI business partner",
        metaRobots: ["max-snippet", "max-image-preview"],
      },
      socialMedia: {
        openGraph: {
          title: "Smart Site | AI-Native Website Platform",
          description:
            "Transform your website into an intelligent business partner with Smart Site's AI-native platform. Create, optimize, and grow your business automatically.",
          type: "website",
        },
        twitter: {
          title: "Smart Site | AI-Native Website Platform",
          description:
            "Transform your website into an intelligent business partner with Smart Site's AI-native platform. Create, optimize, and grow your business automatically.",
          cardType: "summary_large_image",
        },
      },
      structuredData: {
        enableStructuredData: true,
        schemaType: "Organization",
        customSchemaProperties: {
          "@type": "Organization",
          name: "Smart Site",
          description:
            "AI-native website platform that transforms your website into an intelligent business partner.",
          url: "https://smartsite.ai/",
          logo: "https://smartsite.ai/logo.png",
          sameAs: [
            "https://linkedin.com/company/smart-site",
            "https://twitter.com/smartsite",
          ],
        },
      },
    },
    publishedAt: new Date().toISOString(),
  }
}
