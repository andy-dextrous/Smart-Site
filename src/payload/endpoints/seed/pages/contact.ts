import type { Payload } from "payload"
import type { Page, Form } from "@/payload/payload-types"
import { downloadImages, type ImageSet } from "../utils/image-downloader"

/*************************************************************************/
/*  CONTACT PAGE IMAGES
/*************************************************************************/

const images: ImageSet = {
  hero: {
    url: "https://images.unsplash.com/photo-1523961131990-5ea7c61b2107?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
    alt: "Modern office space with contact and communication setup",
    caption: "Professional communication and business contact environment",
    filename: "contact-hero.jpg",
  },
}

/*************************************************************************/
/*  CONTACT PAGE DATA
/*************************************************************************/

type PageArgs = {
  contactForm: Form
}

export const contactPage = async (
  payload: Payload,
  { contactForm }: PageArgs,
  context?: any
): Promise<Omit<Page, "updatedAt" | "id" | "createdAt">> => {
  const media = await downloadImages(payload, images, context)

  return {
    title: "Contact",
    slug: "contact",
    _status: "published",
    sections: [
      {
        blockType: "hero-full",
        heading: "Ready to Build Something Smart?",
        content:
          "Let's transform your website into an intelligent business partner that drives real growth.",
        size: "full",
        colorScheme: "background-image",
        backgroundImage: media.hero.id,
        buttons: [],
      },
      {
        blockType: "contact-form",
        heading: "<span>Start Building</span> Your Smart Site",
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
                    text: "Tell us about your website goals and we'll show you how Smart Site can transform your online presence into an intelligent business partner.",
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
        form: contactForm.id,
        blockName: "Contact Form",
      },
    ],
    seo: {
      meta: {
        title: "Contact Smart Site | Build Your Intelligent Website Today",
        description:
          "Contact Smart Site to transform your website into an intelligent business partner. Get in touch with our team to start building your AI-native website platform.",
        focusKeywords:
          "contact Smart Site, AI-native website, intelligent business partner, smart website platform, website transformation",
        metaRobots: ["max-snippet", "max-image-preview"],
      },
      socialMedia: {
        openGraph: {
          title: "Contact Smart Site | Build Your Intelligent Website Today",
          description:
            "Contact Smart Site to transform your website into an intelligent business partner. Get in touch with our team to start building your AI-native website platform.",
          type: "website",
        },
        twitter: {
          title: "Contact Smart Site | Build Your Intelligent Website Today",
          description:
            "Contact Smart Site to transform your website into an intelligent business partner. Get in touch with our team to start building your AI-native website platform.",
          cardType: "summary_large_image",
        },
      },
      structuredData: {
        enableStructuredData: true,
        schemaType: "WebPage",
        customSchemaProperties: {
          "@type": "WebPage",
          name: "Contact Smart Site",
          description:
            "Contact Smart Site to transform your website into an intelligent business partner with AI-native platform capabilities.",
          url: "https://smartsite.ai/contact",
          mainEntity: {
            "@type": "ContactPage",
            name: "Contact Smart Site",
            description:
              "Get in touch with Smart Site to build your intelligent website and AI-native platform",
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
