import type { Block } from "payload"
import { sectionIntro } from "@/payload/fields/section-intro"

export const Testimonials: Block = {
  slug: "testimonials",
  imageURL: "/api/media/file/testimonials-600x422.png",
  interfaceName: "TestimonialsBlock",
  admin: {
    group: "Business Sections",
  },
  fields: [
    sectionIntro({
      collapsibleLabel: "Content",
      headingDescription:
        "Main heading for testimonials. Use <span> tags for gradient text: 'Trusted By <span>Forward-Thinkers</span>'",
      descriptionDescription:
        "Brief description about your testimonials and client success stories",
    }),
    {
      name: "testimonials",
      type: "relationship",
      relationTo: "testimonials",
      hasMany: true,
      required: true,
      admin: {
        description:
          "Select the testimonials to display in this section. They will appear in the order selected.",
      },
    },
  ],
}
