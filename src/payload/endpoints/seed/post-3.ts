import type { Media, User } from "@/payload/payload-types"
import type { Post } from "@/payload/payload-types"

export type PostArgs = {
  heroImage: Media
  blockImage: Media
  author: User
}

export const post3 = ({
  heroImage,
  blockImage,
  author,
}: PostArgs): Omit<Post, "updatedAt" | "id" | "createdAt"> &
  Partial<Pick<Post, "updatedAt" | "id" | "createdAt">> => {
  return {
    title: "Creative Design Principles",
    slug: "creative-design-principles",
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
                text: "Exploring the fundamental principles of design that shape our digital and physical worlds.",
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
                text: "Good design is everywhere around us, but great design is often invisible - seamlessly integrating into our lives and enhancing our experiences without calling attention to itself.",
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
                text: "User-Centered Approach",
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
                text: "The most effective designs prioritize the needs, expectations, and limitations of end users, creating products and experiences that are intuitive, accessible, and enjoyable.",
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
      title: "Creative Design Principles",
      description:
        "Exploring the fundamental principles of design that shape our digital and physical worlds.",
      image: heroImage.id,
    },
    publishedAt: new Date().toISOString(),
  }
}
