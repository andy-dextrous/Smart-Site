import type { Block } from "payload"
import { sectionIntro } from "@/payload/fields/section-intro"

export const RelatedPosts: Block = {
  slug: "related-posts",
  admin: {
    group: "Blog Sections",
  },
  interfaceName: "RelatedPostsBlock",
  fields: [
    sectionIntro({
      collapsibleLabel: "Section Content",
      headingDescription:
        "Heading for related posts section. Use <span> tags for gradient text: '<span>Related</span> Posts'",
      descriptionDescription: "Optional description that appears below the heading",
    }),
    {
      type: "collapsible",
      label: "Display Options",
      admin: {
        initCollapsed: false,
      },
      fields: [
        {
          name: "maxPosts",
          type: "number",
          defaultValue: 3,
          min: 1,
          max: 12,
          admin: {
            description: "Maximum number of related posts to display",
          },
        },
      ],
    },
    {
      type: "collapsible",
      label: "Display Options",
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: "layout",
          type: "select",
          defaultValue: "grid",
          options: [
            {
              label: "Grid Layout",
              value: "grid",
            },
            {
              label: "List Layout",
              value: "list",
            },
          ],
          admin: {
            description: "Choose how related posts are displayed",
          },
        },
        {
          name: "columns",
          type: "select",
          defaultValue: "three",
          options: [
            {
              label: "Two Columns",
              value: "two",
            },
            {
              label: "Three Columns",
              value: "three",
            },
            {
              label: "Four Columns",
              value: "four",
            },
          ],
          admin: {
            condition: data => data.layout === "grid",
            description: "Number of columns for grid layout",
          },
        },
      ],
    },
  ],
}
