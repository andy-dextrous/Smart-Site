import type { Block } from "payload"
import { button } from "@/payload/fields/buttons"
import { fullwidthCtaDefault } from "@/payload/fields/default-values/fullwidth-cta"

export const FullwidthCta: Block = {
  slug: "fullwidth-cta",
  imageURL: "/api/media/file/fullwidth cta-600x283.png",
  interfaceName: "FullwidthCtaBlock",
  admin: {
    group: "Call-to-Actions",
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "heading",
          type: "text",
          required: true,
          defaultValue: fullwidthCtaDefault.heading,
          admin: {
            description: "Main heading text. You can use HTML tags for styling.",
            width: "50%",
          },
        },
        {
          name: "textAlignment",
          type: "select",
          options: [
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
            { label: "Right", value: "right" },
          ],
          defaultValue: fullwidthCtaDefault.textAlignment,
          required: true,
          admin: {
            description: "Choose text alignment",
            width: "25%",
          },
        },
        {
          name: "colorScheme",
          type: "select",
          options: [
            { label: "Gradient", value: "gradient" },
            { label: "Dark", value: "dark" },
          ],
          defaultValue: fullwidthCtaDefault.colorScheme,
          required: true,
          admin: {
            description: "Choose overlay color scheme",
            width: "25%",
          },
        },
      ],
    },
    {
      name: "description",
      type: "textarea",
      required: true,
      defaultValue: fullwidthCtaDefault.description,
      admin: {
        description: "Supporting description text",
        rows: 4,
      },
    },
    {
      type: "collapsible",
      label: "Background Image",
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: "backgroundImage",
          type: "upload",
          relationTo: "media",
          required: true,
          admin: {
            description: "Background image for the CTA section",
          },
          filterOptions: {
            mimeType: { contains: "image" },
          },
        },
      ],
    },
    {
      type: "collapsible",
      label: "Call to Action Button",
      admin: {
        initCollapsed: false,
      },
      fields: [
        button({
          name: "button",
          required: true,
          defaultValue: fullwidthCtaDefault.button,
          admin: {
            description: "Configure the CTA button",
          },
        }),
      ],
    },
  ],
}
