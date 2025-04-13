import type { Media } from "@/payload/payload-types"
import type { Page } from "@/payload/payload-types"

type HomeArgs = {
  heroImage: Media
  metaImage: Media
}

export const home = ({
  heroImage,
  metaImage,
}: HomeArgs): Omit<Page, "updatedAt" | "id" | "createdAt"> &
  Partial<Pick<Page, "updatedAt" | "id" | "createdAt">> => {
  return {
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
                    version: 3,
                  },
                  {
                    type: "text",
                    detail: 0,
                    format: 0,
                    mode: "normal",
                    style: "",
                    text: " to begin managing this site's content.",
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
      title: "Home",
      description: "Welcome to our website",
      image: metaImage.id,
    },
    publishedAt: new Date().toISOString(),
  }
}
