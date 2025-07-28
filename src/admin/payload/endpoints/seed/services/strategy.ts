import type { Payload } from "payload"
import type { Service } from "@/admin/payload/payload-types"
import { downloadImages, type ImageSet } from "../utils/image-downloader"
import { createRichText, h2, paragraph } from "@/admin/utilities/rich-text-builder"

/*************************************************************************/
/*  STRATEGY SERVICE IMAGES
/*************************************************************************/

const images: ImageSet = {
  hero: {
    url: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
    alt: "Strategic planning session with business documents",
    caption: "Strategic consulting and business planning",
    filename: "strategy-hero.jpg",
  },
}

/*************************************************************************/
/*  STRATEGY SERVICE DATA
/*************************************************************************/

export const strategyService = async (
  payload: Payload,
  context?: any
): Promise<Omit<Service, "updatedAt" | "id" | "createdAt">> => {
  // Download images specific to this service
  const media = await downloadImages(payload, images, context)

  return {
    title: "Strategic Website Planning",
    slug: "strategy",
    description:
      "Develop comprehensive AI-native website strategies that transform your online presence into an intelligent business partner.",
    publishedAt: new Date().toISOString(),
    featuredImage: media.hero.id,
    _status: "published",
    sections: [
      {
        blockType: "hero-full",
        heading: "Strategic Website Planning",
        content:
          "Transform your website strategy with AI-native architecture that turns your online presence into an intelligent business partner through data-driven insights and proven methodologies.",
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
                label: "Plan Your Smart Site",
              },
            },
          },
        ],
        blockName: "Strategy Hero",
      },
      {
        blockType: "simple-text",
        content: createRichText([
          h2("AI-Native Website Strategy & Planning"),
          paragraph([
            "Strategic website planning forms the foundation of every intelligent online presence. Our approach combines audience analysis, competitive intelligence, and AI capability assessments to create actionable strategies that transform websites into business partners.",
            "We work closely with your team to identify growth opportunities, implement AI-driven features, and develop sustainable competitive advantages that position your website as an intelligent business asset.",
          ]),
        ]),
        blockName: "Strategy Content",
      },
      {
        blockType: "fullwidth-cta",
        heading: "Ready to Transform <span>Your Website Strategy?</span>",
        textAlignment: "center",
        colorScheme: "gradient",
        description:
          "Let's collaborate to develop an AI-native website strategy that transforms your online presence into an intelligent business partner.",
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
            label: "Plan Your Smart Site",
          },
        },
        blockName: "Strategy CTA",
      },
    ],
    seo: {
      meta: {
        title: "Strategic Website Planning | AI-Native Strategy | Smart Site",
        description:
          "Transform your website strategy with AI-native architecture that turns your online presence into an intelligent business partner. Expert strategic website planning from Smart Site.",
        focusKeywords:
          "strategic website planning, AI-native strategy, intelligent website strategy, smart site planning, website transformation strategy",
        metaRobots: ["max-snippet", "max-image-preview"],
      },
      socialMedia: {
        openGraph: {
          title: "Strategic Website Planning | AI-Native Strategy | Smart Site",
          description:
            "Transform your website strategy with AI-native architecture that turns your online presence into an intelligent business partner.",
          type: "website",
        },
        twitter: {
          title: "Strategic Website Planning | AI-Native Strategy | Smart Site",
          description:
            "Transform your website strategy with AI-native architecture that turns your online presence into an intelligent business partner.",
          cardType: "summary_large_image",
        },
      },
      structuredData: {
        enableStructuredData: true,
        schemaType: "Service",
        customSchemaProperties: {
          "@type": "Service",
          name: "Strategic Website Planning",
          description:
            "AI-native website strategy services that transform online presence into intelligent business partners.",
          provider: {
            "@type": "Organization",
            name: "Smart Site",
            url: "https://smartsite.ai/",
          },
          serviceType: "Website Strategy",
          areaServed: "Global",
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Strategic Website Planning Services",
            itemListElement: [
              {
                "@type": "Offer",
                itemOffered: {
                  "@type": "Service",
                  name: "AI Strategy Planning",
                  description:
                    "Comprehensive AI-native website strategy and platform planning",
                },
              },
              {
                "@type": "Offer",
                itemOffered: {
                  "@type": "Service",
                  name: "Intelligent Website Architecture",
                  description:
                    "Strategic website architecture for AI-powered business partners",
                },
              },
              {
                "@type": "Offer",
                itemOffered: {
                  "@type": "Service",
                  name: "Platform Optimization",
                  description:
                    "Strategic platform optimization for intelligent business automation",
                },
              },
            ],
          },
        },
      },
    },
  }
}
