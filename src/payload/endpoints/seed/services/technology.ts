import type { Payload } from "payload"
import type { Service } from "@/payload/payload-types"
import { downloadImages, type ImageSet } from "../utils/image-downloader"
import { createRichText, h2, paragraph } from "@/utilities/rich-text-builder"

/*************************************************************************/
/*  TECHNOLOGY SERVICE IMAGES
/*************************************************************************/

const images: ImageSet = {
  hero: {
    url: "https://plus.unsplash.com/premium_photo-1733317429945-a3688f50430b?ixlib=rb-4.0.3&w=1200&q=80",
    alt: "Modern technology office workspace with computers and displays",
    caption: "Technology-driven workspace enabling digital innovation",
    filename: "technology-hero.jpg",
  },
}

/*************************************************************************/
/*  TECHNOLOGY SERVICE DATA
/*************************************************************************/

export const technologyService = async (
  payload: Payload,
  context?: any
): Promise<Omit<Service, "updatedAt" | "id" | "createdAt">> => {
  // Download images specific to this service
  const media = await downloadImages(payload, images, context)

  return {
    title: "Smart Site Technology",
    slug: "technology",
    description:
      "Discover the AI-native technology architecture that powers Smart Site's intelligent website platform.",
    publishedAt: new Date().toISOString(),
    featuredImage: media.hero.id,
    _status: "published",
    sections: [
      {
        blockType: "hero-full",
        heading: "AI-Native Technology Architecture",
        content:
          "Built on Next.js 15, Payload CMS, and cutting-edge AI technology, Smart Site delivers enterprise-grade performance with intelligent business automation.",
        size: "full",
        colorScheme: "background-image",
        backgroundImage: media.hero.id,
        buttons: [
          {
            button: {
              link: {
                type: "custom",
                newTab: false,
                url: "/contact",
                label: "Explore Technology",
              },
            },
          },
        ],
        blockName: "Technology Hero",
      },
      {
        blockType: "simple-text",
        content: createRichText([
          h2("Modern Technology Stack for Intelligent Websites"),
          paragraph(
            "Smart Site is built on a foundation of modern web technologies combined with AI-powered business automation. Our platform delivers 10x faster performance than traditional WordPress sites while providing intelligent features that grow your business automatically."
          ),
          paragraph(
            "From our O(1) URI resolution system to advanced AI workflow orchestration, every component is designed for speed, scalability, and seamless integration with your business operations."
          ),
        ]),
        blockName: "Technology Content",
      },
      {
        blockType: "fullwidth-cta",
        heading: "Ready to Experience <span>Smart Technology?</span>",
        textAlignment: "left",
        colorScheme: "dark",
        description:
          "Discover how Smart Site's AI-native architecture can transform your website into an intelligent business partner.",
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
            label: "Get Started Smart",
          },
        },
        blockName: "Technology CTA",
      },
    ],
    seo: {
      meta: {
        title:
          "Smart Site Technology | AI-Native Website Platform Architecture | Smart Site",
        description:
          "Discover the AI-native technology architecture that powers Smart Site's intelligent website platform. Built on Next.js 15, Payload CMS, and cutting-edge AI technology for enterprise-grade performance.",
        focusKeywords:
          "Smart Site technology, AI-native architecture, Next.js 15, Payload CMS, AI-powered automation, intelligent websites, O(1) URI resolution",
        metaRobots: ["max-snippet", "max-image-preview"],
      },
      socialMedia: {
        openGraph: {
          title: "Smart Site Technology | AI-Native Website Platform Architecture",
          description:
            "Discover the AI-native technology architecture that powers Smart Site's intelligent website platform. Built on Next.js 15, Payload CMS, and cutting-edge AI technology.",
          type: "website",
        },
        twitter: {
          title: "Smart Site Technology | AI-Native Website Platform Architecture",
          description:
            "Discover the AI-native technology architecture that powers Smart Site's intelligent website platform. Built on Next.js 15, Payload CMS, and cutting-edge AI technology.",
          cardType: "summary_large_image",
        },
      },
      structuredData: {
        enableStructuredData: true,
        schemaType: "Service",
        customSchemaProperties: {
          "@type": "Service",
          name: "Smart Site Technology",
          description:
            "AI-native technology architecture that powers Smart Site's intelligent website platform with enterprise-grade performance.",
          provider: {
            "@type": "Organization",
            name: "Smart Site",
            url: "https://smartsite.ai/",
          },
          serviceType: "AI-Native Website Platform",
          areaServed: "Global",
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Smart Site Technology Features",
            itemListElement: [
              {
                "@type": "Offer",
                itemOffered: {
                  "@type": "Service",
                  name: "AI-Native Architecture",
                  description:
                    "Built for AI-powered business automation from the ground up",
                },
              },
              {
                "@type": "Offer",
                itemOffered: {
                  "@type": "Service",
                  name: "Enterprise Performance",
                  description: "10x faster than traditional WordPress sites",
                },
              },
              {
                "@type": "Offer",
                itemOffered: {
                  "@type": "Service",
                  name: "Intelligent Automation",
                  description: "AI workflows that grow your business automatically",
                },
              },
            ],
          },
        },
      },
    },
  }
}
