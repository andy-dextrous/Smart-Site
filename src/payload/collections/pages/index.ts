import type { CollectionConfig } from "payload"

export const Pages: CollectionConfig = {
  slug: "pages",
  auth: true,
  admin: {
    components: {
      views: {
        edit: {
          default: {
            Component: "@/payload/components/custom-edit",
          },
        },
        list: {
          Component: "@/payload/components/custom-list",
        },
      },
    },
  },
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
