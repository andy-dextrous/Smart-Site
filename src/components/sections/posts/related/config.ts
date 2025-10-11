import type { Block } from "payload"

import { sectionSettings } from "@/components/fields/section"

export const PostsRelated: Block = {
  slug: "posts-related",
  interfaceName: "PostsRelatedBlock",
  admin: {
    group: "Blog",
  },
  fields: [
    {
      name: "maxPosts",
      type: "number",
      defaultValue: 3,
      min: 1,
      max: 6,
    },
    sectionSettings(),
  ],
}
