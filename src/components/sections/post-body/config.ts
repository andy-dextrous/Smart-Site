import type { Block } from "payload"

/*************************************************************************/
/*  POST BODY - MINIMAL
/*  No fields; renders the current post's content via section component.
/*************************************************************************/

export const PostBody: Block = {
  slug: "post-body",
  interfaceName: "PostBodyBlock",
  admin: { group: "Blog Sections" },
  fields: [],
}

