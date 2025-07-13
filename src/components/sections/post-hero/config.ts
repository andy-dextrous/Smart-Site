import type { Block } from "payload"

export const PostHero: Block = {
  slug: "post-hero",
  admin: {
    group: "Blog Sections",
  },
  interfaceName: "PostHeroBlock",
  fields: [
    {
      type: "collapsible",
      label: "Display Options",
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: "showAuthor",
          type: "checkbox",
          defaultValue: true,
          admin: {
            description: "Show author information",
          },
        },
        {
          name: "showPublishDate",
          type: "checkbox",
          defaultValue: true,
          admin: {
            description: "Show publish date",
          },
        },
        {
          name: "showCategories",
          type: "checkbox",
          defaultValue: true,
          admin: {
            description: "Show post categories",
          },
        },
      ],
    },
  ],
}
