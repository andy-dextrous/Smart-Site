import type { Block } from "payload"

/*************************************************************************/
/*  RELATED POSTS (MINIMAL)
/*  Displays related posts below the article.
/*************************************************************************/

export const RelatedPostsMinimal: Block = {
  slug: "related-posts-minimal",
  interfaceName: "RelatedPostsMinimalBlock",
  admin: { group: "Blog Sections" },
  fields: [
    { name: "heading", type: "text", defaultValue: "Related Posts" },
    { name: "maxPosts", type: "number", defaultValue: 3, min: 1, max: 12 },
  ],
}

