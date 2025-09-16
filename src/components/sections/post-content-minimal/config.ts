import type { Block } from "payload"

/*************************************************************************/
/*  POST CONTENT (MINIMAL)
/*  Renders the post rich text content.
/*************************************************************************/

export const PostContentMinimal: Block = {
  slug: "post-content-minimal",
  interfaceName: "PostContentMinimalBlock",
  admin: { group: "Blog Sections" },
  fields: [],
}

