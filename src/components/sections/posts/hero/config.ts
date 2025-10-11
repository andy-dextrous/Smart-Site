import type { Block } from "payload"

import { sectionSettings } from "@/components/fields/section"

export const PostsHero: Block = {
  slug: "posts-hero",
  interfaceName: "PostsHeroBlock",
  admin: {
    group: "Blog",
  },
  fields: [
    {
      type: "collapsible",
      label: "Display",
      fields: [
        {
          name: "showCategories",
          type: "checkbox",
          defaultValue: true,
        },
        {
          name: "showAuthor",
          type: "checkbox",
          defaultValue: true,
        },
        {
          name: "showPublishDate",
          type: "checkbox",
          defaultValue: true,
        },
        {
          name: "showReadingTime",
          type: "checkbox",
          defaultValue: true,
        },
        {
          name: "showFeaturedImage",
          type: "checkbox",
          defaultValue: true,
        },
      ],
    },
    sectionSettings(),
  ],
}
