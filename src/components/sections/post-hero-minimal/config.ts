import type { Block } from "payload"

/*************************************************************************/
/*  POST HERO (MINIMAL)
/*  Simple post header with title and meta toggles.
/*************************************************************************/

export const PostHeroMinimal: Block = {
  slug: "post-hero-minimal",
  interfaceName: "PostHeroMinimalBlock",
  admin: { group: "Blog Sections" },
  fields: [
    { name: "showAuthor", type: "checkbox", defaultValue: true, label: "Show author" },
    { name: "showPublishDate", type: "checkbox", defaultValue: true, label: "Show publish date" },
    { name: "showCategories", type: "checkbox", defaultValue: true, label: "Show categories" },
  ],
}

