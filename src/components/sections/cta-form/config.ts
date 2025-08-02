import type { Block } from "payload"
import { sectionIntro } from "@/components/fields/section-intro/section-intro"
import { formVariant } from "@/components/fields/form/form"

export const CtaForm: Block = {
  slug: "cta-form",
  imageURL: "/api/media/file/form cta-1-600x333.png",
  admin: {
    group: "Call-to-Actions",
  },
  interfaceName: "CtaFormBlock",
  fields: [
    sectionIntro({
      collapsibleLabel: "Content",
      headingDescription:
        "Main heading for the CTA form section. Use <span> tags for gradient text: 'Ready to get started? <span>Let's talk</span>'",
      descriptionDescription:
        "Brief description that appears below the heading in the left column",
    }),
    {
      type: "row",
      fields: [
        {
          name: "backgroundColorScheme",
          enumName: "ctaFormBackgroundColorScheme",
          type: "select",
          options: [
            { label: "Dark", value: "dark" },
            { label: "Light", value: "light" },
            { label: "Neutral", value: "neutral" },
            { label: "Background Image", value: "image" },
          ],
          defaultValue: "dark",
          required: true,
          admin: {
            description: "Choose background color scheme for the section",
            width: "50%",
          },
        },
        {
          name: "variant",
          enumName: "ctaFormFormVariant",
          type: "select",
          label: "Form Variant",
          defaultValue: "neutral",
          options: [
            { label: "Dark", value: "dark" },
            { label: "Light", value: "light" },
            { label: "Neutral", value: "neutral" },
            { label: "Transparent", value: "transparent" },
          ],
          admin: {
            description: "Visual style for the form based on background",
            width: "50%",
          },
        },
      ],
    },
    {
      type: "collapsible",
      label: "Background Image",
      admin: {
        initCollapsed: true,
        condition: (_, siblingData) => siblingData?.backgroundColorScheme === "image",
      },
      fields: [
        {
          name: "backgroundImage",
          type: "upload",
          relationTo: "media",
          required: true,
          admin: {
            description: "Background image for the CTA form section",
            condition: (_, siblingData) => siblingData?.backgroundColorScheme === "image",
          },
          filterOptions: {
            mimeType: { contains: "image" },
          },
        },
      ],
    },
    {
      name: "form",
      type: "relationship",
      relationTo: "forms",
      required: true,
      admin: {
        description: "Select the form to display in the right column",
      },
    },
  ],
}
