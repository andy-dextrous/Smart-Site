import type { Block } from "payload"
import { sectionIntro } from "@/payload/fields/section-intro"
import { sectionCta } from "@/payload/fields/section-cta"

export const ServiceCardsList: Block = {
  slug: "service-cards-list",
  imageURL: "/api/media/file/service cards-600x490.png",
  admin: {
    group: "Business Sections",
  },
  interfaceName: "ServiceCardsListBlock",
  fields: [
    sectionIntro({
      collapsibleLabel: "Content",
      headingDescription:
        "Main heading for the services section. Use <span> tags for gradient text: 'Commercial, Operational <span>& Technology Services</span>'",
      descriptionDescription: "Brief description of your services and value proposition",
    }),
    sectionCta({
      collapsibleLabel: "Section CTA",
      textDescription: "Text that appears before the call-to-action button",
      buttonDescription: "Button that links to more services or related content",
    }),
  ],
}
