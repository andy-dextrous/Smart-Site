import type { Block } from "payload"
import { sectionIntro } from "@/components/fields/section-intro/section-intro"
import { formVariant } from "@/components/fields/form/form"

export const ContactForm: Block = {
  slug: "contact-form",
  imageURL: "/api/media/file/contact form-600x547.png",
  interfaceName: "ContactFormBlock",
  admin: {
    group: "Call-to-Actions",
  },
  fields: [
    sectionIntro({
      collapsibleLabel: "Section Introduction",
      headingDescription:
        "Main heading for the form section. Use <span> tags for gradient text.",
      descriptionDescription: "Brief description that appears above the form",
    }),
    formVariant({
      admin: {
        description: "Form configuration with contextual styling",
      },
    }),
  ],
}
