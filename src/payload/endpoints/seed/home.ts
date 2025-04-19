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
        content:
          "Visit the admin dashboard to make your account and seed content for your website.",
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
