import type { Payload } from "payload"
import type { Page } from "@/admin/payload/payload-types"
import { downloadImages, type ImageSet } from "../utils/image-downloader"

/*************************************************************************/
/*  INSIGHTS PAGE IMAGES
/*************************************************************************/

const images: ImageSet = {
  hero: {
    url: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
    alt: "Modern workplace with industry insights and data visualization",
    caption: "Strategic insights and business intelligence",
    filename: "insights-hero.jpg",
  },
}

/*************************************************************************/
/*  INSIGHTS PAGE DATA
/*************************************************************************/

export const insightsPage = async (
  payload: Payload,
  context?: any
): Promise<Omit<Page, "updatedAt" | "id" | "createdAt">> => {
  // Download images specific to this page
  const media = await downloadImages(payload, images, context)

  return {
    title: "Insights",
    slug: "insights",
    _status: "published",
    sections: [
      {
        blockType: "hero-full",
        heading: "AI-Native Insights & <span>Platform Knowledge</span>",
        content:
          "Stay ahead with actionable insights on AI-powered websites, intelligent business automation, and the future of web platforms.",
        size: "full",
        colorScheme: "background-image",
        backgroundImage: media.hero.id,
        buttons: [],
        blockName: "Insights Hero",
      },
      {
        blockType: "posts-archive",
        heading: "Latest <span>Articles</span>",
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
                    text: "Explore our collection of insights, case studies, and thought leadership on AI-native websites, intelligent business automation, and the future of web platforms.",
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
        blockName: "Posts Archive",
      },
    ],
    seo: {
      meta: {
        title: "Insights | AI-Native Platform Knowledge & Web Intelligence | Smart Site",
        description:
          "Stay ahead with actionable insights on AI-powered websites, intelligent business automation, and the future of web platforms. Expert thought leadership from Smart Site.",
        focusKeywords:
          "AI-native insights, intelligent websites, AI-powered platforms, website automation, smart web development, AI business partners",
        metaRobots: ["max-snippet", "max-image-preview"],
      },
      socialMedia: {
        openGraph: {
          title:
            "Insights | AI-Native Platform Knowledge & Web Intelligence | Smart Site",
          description:
            "Stay ahead with actionable insights on AI-powered websites, intelligent business automation, and the future of web platforms. Expert thought leadership from Smart Site.",
          type: "website",
        },
        twitter: {
          title:
            "Insights | AI-Native Platform Knowledge & Web Intelligence | Smart Site",
          description:
            "Stay ahead with actionable insights on AI-powered websites, intelligent business automation, and the future of web platforms. Expert thought leadership from Smart Site.",
          cardType: "summary_large_image",
        },
      },
      structuredData: {
        enableStructuredData: true,
        schemaType: "WebPage",
        customSchemaProperties: {
          "@type": "WebPage",
          name: "Smart Site Insights",
          description:
            "AI-native platform knowledge and web intelligence on intelligent websites, business automation, and the future of web platforms.",
          url: "https://smartsite.ai/insights",
          mainEntity: {
            "@type": "Blog",
            name: "Smart Site Insights",
            description:
              "Expert thought leadership and platform knowledge on AI-native websites and intelligent business automation",
            publisher: {
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
