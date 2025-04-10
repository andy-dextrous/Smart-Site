import type { Media, User } from "@/payload/payload-types"
import type { Post } from "@/payload/payload-types"

export type PostArgs = {
  heroImage: Media
  blockImage: Media
  author: User
}

export const post2 = ({
  heroImage,
  blockImage,
  author,
}: PostArgs): Omit<Post, "updatedAt" | "id" | "createdAt"> &
  Partial<Pick<Post, "updatedAt" | "id" | "createdAt">> => {
  return {
    title: "Sustainable Tech Futures",
    slug: "sustainable-tech-futures",
    _status: "published",
    authors: [author.id],
    heroImage: heroImage.id,
    content: {
      root: {
        type: "root",
        children: [
          {
            type: "heading",
            children: [
              {
                type: "text",
                detail: 0,
                format: 0,
                mode: "normal",
                style: "",
                text: "Examining how green technology is shaping sustainable futures and transforming industries through eco-conscious innovation.",
                version: 1,
              },
            ],
            direction: "ltr",
            format: "",
            indent: 0,
            tag: "h2",
            version: 1,
          },
          {
            type: "paragraph",
            children: [
              {
                type: "text",
                detail: 0,
                format: 0,
                mode: "normal",
                style: "",
                text: "The intersection of technology and sustainability is creating new opportunities for businesses to reduce their environmental impact while driving innovation.",
                version: 1,
              },
            ],
            direction: "ltr",
            format: "",
            indent: 0,
            textFormat: 0,
            version: 1,
          },
          {
            type: "heading",
            children: [
              {
                type: "text",
                detail: 0,
                format: 0,
                mode: "normal",
                style: "",
                text: "Renewable Energy Systems",
                version: 1,
              },
            ],
            direction: "ltr",
            format: "",
            indent: 0,
            tag: "h2",
            version: 1,
          },
          {
            type: "paragraph",
            children: [
              {
                type: "text",
                detail: 0,
                format: 0,
                mode: "normal",
                style: "",
                text: "Smart grids and renewable energy technologies are making it possible to create more efficient and sustainable power systems, reducing our dependence on fossil fuels.",
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
    categories: [],
    meta: {
      title: "Sustainable Tech Futures",
      description:
        "Examining how green technology is shaping sustainable futures through eco-conscious innovation.",
      image: heroImage.id,
    },
    publishedAt: new Date().toISOString(),
  }
}
