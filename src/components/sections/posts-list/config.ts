import type { Block } from "payload"
import { sectionIntro } from "@/components/fields/section-intro/section-intro"

/*************************************************************************/
/*  POSTS LIST - MINIMAL
/*************************************************************************/

export const PostsList: Block = {
  slug: "posts-list",
  interfaceName: "PostsListBlock",
  admin: {
    group: "Blog Sections",
  },
  fields: [
    sectionIntro({
      headingRequired: false,
      headingDescription: "Main heading for the posts list",
      descriptionDescription: "Optional description shown below the heading",
      descriptionRequired: false,
      collapsibleLabel: "Section Content",
    }),
    {
      name: "postsPerPage",
      type: "number",
      defaultValue: 6,
      min: 1,
      max: 50,
      admin: { description: "Number of posts to show" },
    },
  ],
}
