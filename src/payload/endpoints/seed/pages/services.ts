import type { Payload } from "payload"
import type { Page } from "@/payload/payload-types"
import { downloadImages, type ImageSet } from "../utils/image-downloader"

/*************************************************************************/
/*  SERVICES PAGE IMAGES
/*************************************************************************/

const images: ImageSet = {
  hero: {
    url: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
    alt: "Business consulting meeting with stakeholders",
    caption: "Professional consulting services and advisory",
    filename: "services-hero.jpg",
  },
}

/*************************************************************************/
/*  SERVICES PAGE DATA
/*************************************************************************/

export const servicesPage = async (
  payload: Payload,
  context?: any
): Promise<Omit<Page, "updatedAt" | "id" | "createdAt">> => {
  const media = await downloadImages(payload, images, context)

  return {
    title: "Services",
    slug: "services",
    _status: "published",
    sections: [
      {
        blockType: "hero-full",
        heading: "Smart Site Services",
        content:
          "Transform your website into an intelligent business partner with our AI-native platform capabilities.",
        size: "full",
        colorScheme: "background-image",
        backgroundImage: media.hero.id,
        buttons: [],
        blockName: "Services Hero",
      },
      {
        blockType: "service-cards-list",
        heading: "Platform <span>Capabilities</span>",
        description: {
          root: {
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: "normal",
                    style: "",
                    text: "From AI-powered content creation to automated marketing workflows, our platform transforms static websites into intelligent business partners that actively drive growth.",
                    type: "text",
                    version: 1,
                  },
                ],
                direction: "ltr",
                format: "",
                indent: 0,
                type: "paragraph",
                version: 1,
                textFormat: 0,
                textStyle: "",
              },
            ],
            direction: "ltr",
            format: "",
            indent: 0,
            type: "root",
            version: 1,
          },
        },
        text: "Ready to transform your website? Let's build something intelligent together",
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
        blockName: "Services List",
      },
    ],
    seo: {
      meta: {
        title: "Smart Site Platform Capabilities | AI-Native Website Services",
        description:
          "Transform your website into an intelligent business partner with Smart Site's AI-native platform. From content creation to marketing automation, discover our full suite of capabilities.",
        focusKeywords:
          "AI-native website platform, intelligent website services, AI-powered content creation, website automation, smart website capabilities",
        metaRobots: ["max-snippet", "max-image-preview"],
      },
      socialMedia: {
        openGraph: {
          title: "Smart Site Platform Capabilities | AI-Native Website Services",
          description:
            "Transform your website into an intelligent business partner with Smart Site's AI-native platform. From content creation to marketing automation, discover our full suite of capabilities.",
          type: "website",
        },
        twitter: {
          title: "Smart Site Platform Capabilities | AI-Native Website Services",
          description:
            "Transform your website into an intelligent business partner with Smart Site's AI-native platform. From content creation to marketing automation, discover our full suite of capabilities.",
          cardType: "summary_large_image",
        },
      },
      structuredData: {
        enableStructuredData: true,
        schemaType: "WebPage",
        customSchemaProperties: {
          "@type": "WebPage",
          name: "Smart Site Platform Capabilities",
          description:
            "AI-native website platform capabilities including content creation, marketing automation, and intelligent business partner features.",
          url: "https://smartsite.ai/services",
          mainEntity: {
            "@type": "Service",
            name: "AI-Native Website Platform",
            description:
              "Transform static websites into intelligent business partners with AI-powered content creation and marketing automation",
            provider: {
              "@type": "Organization",
              name: "Smart Site",
              url: "https://smartsite.ai/",
            },
          },
        },
      },
    },
    publishedAt: new Date().toISOString(),
  }
}
