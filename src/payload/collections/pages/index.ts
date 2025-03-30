import type { CollectionConfig } from "payload"

export const Pages: CollectionConfig = {
  slug: "pages",
  // auth: true,
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
    },
    {
      name: "content",
      type: "richText",
    },
  ],
}
