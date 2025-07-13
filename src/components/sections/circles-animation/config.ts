import type { Block } from "payload"
import { richContent } from "@/payload/fields/content"

export const CirclesAnimation: Block = {
  slug: "circles-animation",
  imageURL: "/api/media/file/circles animation-600x338.png",
  interfaceName: "CirclesAnimationBlock",
  admin: {
    group: "Dynamic & Interactive",
  },
  fields: [
    {
      type: "collapsible",
      label: "Content",
      admin: {
        initCollapsed: false,
      },
      fields: [
        {
          name: "title",
          type: "text",
          required: true,
          admin: {
            description:
              "Use <span> tags to designate text that should have the purple gradient effect. Example: 'Bridging Vision & <span>Execution</span>'",
          },
        },
        richContent({
          name: "description",
          label: "Description",
          required: true,
        }),
      ],
    },
    {
      type: "collapsible",
      label: "Infographic Content",
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: "leftCircleWords",
          type: "array",
          minRows: 3,
          maxRows: 3,
          required: true,
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "word",
                  type: "text",
                  required: true,
                  admin: {
                    width: "100%",
                  },
                },
              ],
            },
          ],
          admin: {
            description: "Exactly three words for the left circle",
          },
        },
        {
          name: "rightCircleWords",
          type: "array",
          minRows: 3,
          maxRows: 3,
          required: true,
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "word",
                  type: "text",
                  required: true,
                  admin: {
                    width: "100%",
                  },
                },
              ],
            },
          ],
          admin: {
            description: "Exactly three words for the right circle",
          },
        },
        {
          name: "bottomText",
          type: "text",
          required: true,
          admin: {
            description: "Text that appears at the bottom of the infographic",
          },
        },
      ],
    },
  ],
}
