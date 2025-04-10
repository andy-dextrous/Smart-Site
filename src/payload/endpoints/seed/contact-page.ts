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
    layout: [
      {
        blockType: "hero-primary",
        heading: "Contact Us",
        content: {
          root: {
            type: "root",
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    type: "text",
                    detail: 0,
                    format: 0,
                    mode: "normal",
                    style: "",
                    text: "Get in touch with our team. Please use the form below or contact us directly.",
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
      title: "Contact Us",
      description: "Get in touch with our team",
    },
    publishedAt: new Date().toISOString(),
  }
}
