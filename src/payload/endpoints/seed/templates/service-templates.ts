import type { Template } from "@/payload/payload-types"
import type { Payload } from "payload"
import { downloadImages, type ImageSet } from "../utils/image-downloader"
import { createRichText, h2, paragraph } from "@/utilities/rich-text-builder"

/*************************************************************************/
/*  TEMPLATE IMAGES
/*************************************************************************/

const images: ImageSet = {
  serviceHero: {
    url: "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
    alt: "Professional service delivery",
    caption: "Service template hero image",
    filename: "service-template-hero.jpg",
  },
  ctaBackground: {
    url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
    alt: "Call to action background",
    caption: "Template CTA background",
    filename: "template-cta-bg.jpg",
  },
  teamHero: {
    url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
    alt: "Team member professional photo",
    caption: "Team member template hero",
    filename: "team-template-hero.jpg",
  },
}

/*************************************************************************/
/*  SERVICE TEMPLATES
/*************************************************************************/

export const serviceTemplates = async (
  payload: Payload,
  context?: any
): Promise<Omit<Template, "updatedAt" | "id" | "createdAt">[]> => {
  // Download images specific to these templates
  const media = await downloadImages(payload, images, context)

  return [
    {
      name: "Service Page Template",
      description: "Template for individual service pages",
      sections: [
        {
          blockType: "hero-full",
          heading: "Service Name",
          content: "Brief description of the service offering",
          size: "full",
          colorScheme: "background-image",
          backgroundImage: media.serviceHero.id,
          buttons: [],
          id: "68491a18c8d8152b9ea90d2f",
        },
        {
          blockType: "simple-text",
          content: createRichText([
            paragraph([
              "This is where you would describe the service in detail. Replace this content with specific information about your service offering, including benefits, features, and what sets it apart from competitors.",
              "",
              "Additional content can be added here to provide more details about the service features, process, or methodology.",
            ]),
          ]),
          id: "68491a5492cea8649fc431cb",
        },
      ],
    },
    {
      name: "Post Template",
      description: "Template for individual blog posts and articles",
      sections: [
        {
          blockType: "post-hero",
          showAuthor: true,
          showPublishDate: true,
          showCategories: true,
          id: "6859ceb62850bd2a2912c7c3",
        },
        {
          blockType: "post-content",
          showBreadcrumbs: true,
          showAuthorInfo: true,
          proseSize: "xl",
          id: "6859ced92850bd2a2912c7c5",
        },
        {
          blockType: "related-posts",
          heading: "<span>Related</span> Posts",
          description: createRichText([paragraph(" ")]),
          maxPosts: 3,
          layout: "grid",
          columns: "three",
          id: "6859e11579436e53b6e87a1e",
        },
        {
          blockType: "fullwidth-cta",
          heading: "See the Difference in Days",
          textAlignment: "left",
          colorScheme: "gradient",
          description:
            "Watch a fast demo and see how intelligent automation transforms your workflow: less effort, more results.",
          backgroundImage: media.ctaBackground.id,
          button: {
            variant: "white",
            size: "lg",
            layout: "default",
            icon: false,
            link: {
              type: "custom",
              newTab: false,
              url: "/contact",
              label: "Get Started Today",
            },
          },
          id: "6859e34d9b0798aae8ddb791",
        },
      ],
    },
    {
      name: "Team Member Template",
      description: "Template for individual team member pages",
      sections: [
        {
          blockType: "hero-primary",
          heading: "Team Member Name",
          content: "Position Title",
          usp: "Brief description of team member expertise and background",
          backgroundImage: media.teamHero.id,
          buttons: [
            {
              button: {
                link: {
                  type: "custom",
                  newTab: false,
                  url: "/contact",
                  label: "Get In Touch",
                },
              },
            },
          ],
          blockName: "Team Member Hero",
        },
        {
          blockType: "simple-text",
          content: createRichText([
            h2("About [Team Member Name]"),
            paragraph([
              "Replace this with detailed information about the team member's background, expertise, and role within the organization. Include their professional experience, qualifications, and what they bring to the team.",
              "Additional content about their specializations, achievements, or personal interests that help clients connect with them on a professional level.",
            ]),
          ]),
          blockName: "Team Member Bio",
        },
      ],
    },
  ]
}
