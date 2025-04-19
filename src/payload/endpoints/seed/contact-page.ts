import type { Form } from "@/payload/payload-types"
import type { Page } from "@/payload/payload-types"

type ContactArgs = {
  contactForm: Form
}

export const contact = ({
  contactForm,
}: ContactArgs): Omit<Page, "updatedAt" | "id" | "createdAt"> &
  Partial<Pick<Page, "updatedAt" | "id" | "createdAt">> => {
  return {
    title: "Contact",
    slug: "contact",
    _status: "published",
    sections: [
      {
        blockType: "hero-primary",
        heading: "Contact Us",
        content: "Contact Us",
      },
    ],
    meta: {
      title: "Contact Us",
      description: "Get in touch with our team",
    },
    publishedAt: new Date().toISOString(),
  }
}
