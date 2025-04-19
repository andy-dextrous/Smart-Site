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
      content:
        "Visit the admin dashboard to make your account and seed content for your website.",
    },
  ],
  meta: {
    description: "An open-source website built with Payload and Next.js.",
    title: "Payload Website Template",
  },
  publishedAt: new Date().toISOString(),
}
