import type { Block } from "payload"

export const PostContent: Block = {
  slug: "post-content",
  admin: {
    group: "Blog Sections",
  },
  interfaceName: "PostContentBlock",
  fields: [
    {
      type: "collapsible",
      label: "Display Options",
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: "showBreadcrumbs",
          type: "checkbox",
          defaultValue: true,
          admin: {
            description: "Show breadcrumb navigation",
          },
        },
        {
          name: "showAuthorInfo",
          type: "checkbox",
          defaultValue: true,
          admin: {
            description: "Show author information at the end of the post",
          },
        },
        {
          name: "proseSize",
          type: "select",
          defaultValue: "xl",
          options: [
            {
              label: "Base",
              value: "base",
            },
            {
              label: "Large",
              value: "lg",
            },
            {
              label: "Extra Large",
              value: "xl",
            },
            {
              label: "2X Large",
              value: "2xl",
            },
          ],
          admin: {
            description: "Control the size of the post content text",
          },
        },
      ],
    },
  ],
}
