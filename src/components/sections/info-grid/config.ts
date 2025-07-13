import type { Block } from "payload"
import { sectionIntro } from "@/payload/fields/section-intro"
import { infoGridDefault } from "@/payload/fields/default-values/info-grid"

export const InfoGrid: Block = {
  slug: "info-grid",
  imageURL: "/api/media/file/data grid-600x381.png",
  admin: {
    group: "Content & Media",
  },
  interfaceName: "InfoGridBlock",
  fields: [
    sectionIntro({
      collapsibleLabel: "Content",
      headingDescription:
        "Main heading for the info grid section. Use <span> tags for gradient text: 'How We Turn <span>Strategy Into Results</span>'",
      descriptionDescription:
        "Brief description of your process and approach that appears below the heading",
    }),
    {
      type: "row",
      fields: [
        {
          name: "backgroundColorScheme",
          type: "select",
          options: [
            { label: "Dark", value: "dark" },
            { label: "Light", value: "light" },
          ],
          defaultValue: infoGridDefault.backgroundColorScheme,
          required: true,
          admin: {
            description: "Choose background color scheme for the section",
            width: "50%",
          },
        },
        {
          name: "gridColumns",
          type: "select",
          options: [
            { label: "2 Columns", value: "2" },
            { label: "3 Columns", value: "3" },
            { label: "4 Columns", value: "4" },
          ],
          defaultValue: infoGridDefault.gridColumns,
          required: true,
          admin: {
            description: "Number of columns for the process steps grid",
            width: "50%",
          },
        },
      ],
    },
    {
      type: "collapsible",
      label: "Process Steps",
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: "processSteps",
          type: "array",
          minRows: 2,
          maxRows: 6,
          required: true,
          defaultValue: infoGridDefault.processSteps,
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "title",
                  type: "text",
                  required: true,
                  admin: {
                    width: "30%",
                  },
                },
                {
                  name: "description",
                  type: "textarea",
                  required: true,
                  admin: {
                    width: "70%",
                    rows: 3,
                  },
                },
              ],
            },
          ],
          admin: {
            description:
              "Add process steps for your methodology. Steps will be automatically numbered based on their order.",
          },
        },
      ],
    },
  ],
}
