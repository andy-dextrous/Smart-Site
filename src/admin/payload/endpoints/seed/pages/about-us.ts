import type { Payload } from "payload"
import type { Page } from "@/admin/payload/payload-types"
import { downloadImages, type ImageSet } from "../utils/image-downloader"
import { createRichText, h2, paragraph } from "@/admin/utilities/rich-text-builder"

/*************************************************************************/
/*  ABOUT US PAGE IMAGES
/*************************************************************************/

const images: ImageSet = {
  hero: {
    url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
    alt: "Professional business team collaborating on strategy",
    caption: "Strategic team collaboration driving business transformation",
    filename: "about-hero.jpg",
  },
}

/*************************************************************************/
/*  ABOUT US PAGE DATA
/*************************************************************************/

export const aboutUsPage = async (
  payload: Payload,
  context?: any
): Promise<Omit<Page, "updatedAt" | "id" | "createdAt">> => {
  // Download images specific to this page
  const media = await downloadImages(payload, images, context)

  return {
    title: "About Us",
    slug: "about-us",
    _status: "published",
    sections: [
      {
        blockType: "hero-full",
        heading: "Redefining What Websites Can Do",
        content:
          "We transform static websites into intelligent business partners that actively drive growth through AI-native architecture.",
        size: "full",
        colorScheme: "background-image",
        backgroundImage: media.hero.id,
        buttons: [],
      },
      {
        blockType: "simple-text",
        content: createRichText([
          h2("Our Vision"),
          paragraph(
            "At Smart Site, we believe your website should be more than a digital brochure. It should be an intelligent business partner that actively contributes to your growth. We've reimagined what websites can do by combining AI-native architecture with proven business intelligence."
          ),
          paragraph(
            "Our approach transforms static websites into dynamic business automation systems. Smart Site seamlessly integrates AI-powered content creation, SEO optimization, and marketing workflows to deliver measurable business outcomes."
          ),
          paragraph(
            "We don't just build websites – we build intelligent business partners that grow with you."
          ),
        ]),
      },
      {
        blockType: "fullwidth-cta",
        heading: "Ready to Transform <span>Your Website?</span>",
        textAlignment: "left",
        colorScheme: "dark",
        description:
          "Let's build an intelligent business partner that actively drives your growth. Experience the power of AI-native website architecture.",
        backgroundImage: media.hero.id,
        button: {
          variant: "default",
          size: "lg",
          layout: "default",
          icon: false,
          link: {
            type: "custom",
            newTab: false,
            url: "/contact",
            label: "Start Building Smart",
          },
        },
        blockName: "Contact CTA",
      },
    ],
    seo: {
      meta: {
        title: "About Smart Site | Redefining What Websites Can Do",
        description:
          "Learn about Smart Site's mission to transform static websites into intelligent business partners. We combine AI-native architecture with business intelligence to drive measurable growth.",
        focusKeywords:
          "Smart Site about us, AI-native websites, intelligent business partners, website automation, AI-powered platform, business growth",
        metaRobots: ["max-snippet", "max-image-preview"],
      },
      socialMedia: {
        openGraph: {
          title: "About Smart Site | Redefining What Websites Can Do",
          description:
            "Learn about our mission to transform static websites into intelligent business partners. We combine AI-native architecture with business intelligence to drive measurable growth.",
          type: "website",
        },
        twitter: {
          title: "About Smart Site | Redefining What Websites Can Do",
          description:
            "Learn about our mission to transform static websites into intelligent business partners. We combine AI-native architecture with business intelligence to drive measurable growth.",
          cardType: "summary_large_image",
        },
      },
      structuredData: {
        enableStructuredData: true,
        schemaType: "WebPage",
        customSchemaProperties: {
          "@type": "WebPage",
          name: "About Smart Site",
          description:
            "Learn about Smart Site's mission to transform static websites into intelligent business partners through AI-native architecture.",
          url: "https://smartsite.ai/about-us",
          mainEntity: {
            "@type": "Organization",
            name: "Smart Site",
            description:
              "AI-native website platform that transforms static websites into intelligent business partners",
            foundingDate: "2024",
            url: "https://smartsite.ai/",
          },
        },
      },
    },
    publishedAt: new Date().toISOString(),
  }
}
