import type { Media, User } from "@/payload/payload-types"
import type { Post } from "@/payload/payload-types"

export type PostArgs = {
  heroImage: Media
  blockImage: Media
  author: User
}

export const post1 = ({
  heroImage,
  blockImage,
  author,
}: PostArgs): Omit<Post, "updatedAt" | "id" | "createdAt"> &
  Partial<Pick<Post, "updatedAt" | "id" | "createdAt">> => {
  return {
    title: "Digital Horizons",
    slug: "digital-horizons",
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
                text: "Dive into the marvels of modern innovation, where the only constant is change. A journey where pixels and data converge to craft the future.",
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
                text: "We find ourselves in a transformative era where artificial intelligence (AI) stands at the forefront of technological evolution. The ripple effects of its advancements are reshaping industries at an unprecedented pace.",
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
                text: "IoT: Connecting the World Around Us",
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
                text: "In today's rapidly evolving technological landscape, the Internet of Things (IoT) stands out as a revolutionary force. From transforming our residences with smart home systems to redefining transportation through connected cars, IoT's influence is palpable in nearly every facet of our daily lives.",
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
      title: "Digital Horizons: Exploring Modern Technology",
      description:
        "Dive into the marvels of modern innovation, where the only constant is change.",
      image: heroImage.id,
    },
    publishedAt: new Date().toISOString(),
  }
}
