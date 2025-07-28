import type { Payload } from "payload"
import type { Service } from "@/admin/payload/payload-types"
import { downloadImages, type ImageSet } from "../utils/image-downloader"
import { createRichText, h2, paragraph } from "@/admin/utilities/rich-text-builder"

/*************************************************************************/
/*  OPERATIONS SERVICE IMAGES
/*************************************************************************/

const images: ImageSet = {
  hero: {
    url: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
    alt: "Growth chart showing upward business trajectory",
    caption: "Measurable business growth and success metrics",
    filename: "operations-hero.jpg",
  },
}

/*************************************************************************/
/*  OPERATIONS SERVICE DATA
/*************************************************************************/

export const operationsService = async (
  payload: Payload,
  context?: any
): Promise<Omit<Service, "updatedAt" | "id" | "createdAt">> => {
  // Download images specific to this service
  const media = await downloadImages(payload, images, context)

  return {
    title: "Smart Site Operations",
    slug: "operations",
    description:
      "Discover how Smart Site automates business operations through AI-powered workflows and intelligent website management.",
    publishedAt: new Date().toISOString(),
    featuredImage: media.hero.id,
    _status: "published",
    sections: [
      {
        blockType: "hero-full",
        heading: "AI-Powered Operations",
        content:
          "Smart Site transforms traditional website management into intelligent business operations through AI-powered automation and streamlined workflows.",
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
                label: "Automate Operations",
              },
            },
          },
        ],
        blockName: "Operations Hero",
      },
      {
        blockType: "simple-text",
        content: createRichText([
          h2("Intelligent Operations & Automation"),
          paragraph(
            "Smart Site revolutionizes business operations by turning your website into an intelligent business partner. Our AI-powered platform automates content creation, lead management, and customer engagement processes."
          ),
          paragraph(
            "From automated SEO optimization to intelligent social media scheduling, Smart Site handles operational tasks so you can focus on strategic growth. Experience the future of business automation with our AI-native platform."
          ),
        ]),
        blockName: "Operations Content",
      },
      {
        blockType: "fullwidth-cta",
        heading: "Ready to Automate <span>Your Operations?</span>",
        textAlignment: "center",
        colorScheme: "gradient",
        description:
          "Discover how Smart Site's AI-powered operations can transform your business workflow and drive intelligent automation.",
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
            label: "Start Automating",
          },
        },
        blockName: "Operations CTA",
      },
    ],
    seo: {
      meta: {
        title: "Smart Site Operations | AI-Powered Business Automation | Smart Site",
        description:
          "Discover how Smart Site automates business operations through AI-powered workflows and intelligent website management. Transform your website into an intelligent business partner.",
        focusKeywords:
          "Smart Site operations, AI-powered automation, intelligent workflows, business automation, AI website management, automated operations",
        metaRobots: ["max-snippet", "max-image-preview"],
      },
      socialMedia: {
        openGraph: {
          title: "Smart Site Operations | AI-Powered Business Automation",
          description:
            "Discover how Smart Site automates business operations through AI-powered workflows and intelligent website management. Transform your website into an intelligent business partner.",
          type: "website",
        },
        twitter: {
          title: "Smart Site Operations | AI-Powered Business Automation",
          description:
            "Discover how Smart Site automates business operations through AI-powered workflows and intelligent website management. Transform your website into an intelligent business partner.",
          cardType: "summary_large_image",
        },
      },
      structuredData: {
        enableStructuredData: true,
        schemaType: "Service",
        customSchemaProperties: {
          "@type": "Service",
          name: "Smart Site Operations",
          description:
            "AI-powered business automation through intelligent workflows and website management that transforms your website into an intelligent business partner.",
          provider: {
            "@type": "Organization",
            name: "Smart Site",
            url: "https://smartsite.ai/",
          },
          serviceType: "AI-Powered Business Automation",
          areaServed: "Global",
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Smart Site Operations Features",
            itemListElement: [
              {
                "@type": "Offer",
                itemOffered: {
                  "@type": "Service",
                  name: "AI Workflow Automation",
                  description:
                    "Intelligent automation of business processes and workflows",
                },
              },
              {
                "@type": "Offer",
                itemOffered: {
                  "@type": "Service",
                  name: "Intelligent Content Management",
                  description: "AI-powered content creation and management systems",
                },
              },
              {
                "@type": "Offer",
                itemOffered: {
                  "@type": "Service",
                  name: "Automated Lead Management",
                  description: "AI-driven lead capture, qualification, and nurturing",
                },
              },
            ],
          },
        },
      },
    },
  }
}
