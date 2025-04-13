import type { Page } from "@/payload/payload-types"

// Used for pre-seeded content so that the homepage is not empty
export const homeStatic: Omit<Page, "updatedAt" | "id" | "createdAt"> &
  Partial<Pick<Page, "updatedAt" | "id" | "createdAt">> = {
  title: "Home",
  slug: "home",
  _status: "published",
  sections: [
    {
      blockType: "hero-primary",
      heading: "Payload Website Template",
      content: {
        root: {
          type: "root",
          children: [
            {
              type: "paragraph",
              children: [
                {
                  type: "link",
                  children: [
                    {
                      type: "text",
                      detail: 0,
                      format: 0,
                      mode: "normal",
                      style: "",
                      text: "Visit the admin dashboard",
                      version: 1,
                    },
                  ],
                  direction: "ltr",
                  fields: {
                    linkType: "custom",
                    newTab: false,
                    url: "/admin",
                  },
                  format: "",
                  indent: 0,
                  version: 2,
                },
                {
                  type: "text",
                  detail: 0,
                  format: 0,
                  mode: "normal",
                  style: "",
                  text: " to make your account and seed content for your website.",
                  version: 1,
                },
              ],
              direction: "ltr",
              format: "",
              indent: 0,
              textFormat: 0,
              version: 1,
            },
          ],
          direction: "ltr",
          format: "",
          indent: 0,
          version: 1,
        },
      },
    },
  ],
  meta: {
    description: "An open-source website built with Payload and Next.js.",
    title: "Payload Website Template",
  },
  publishedAt: new Date().toISOString(),
}
