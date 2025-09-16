import type { Payload } from "payload"
import type { Page, Form, ContactFormSimpleBlock } from "@/admin/payload/payload-types"
import { createRichText, paragraph } from "@/admin/utilities/rich-text-builder"
import { formatIdForRelationship } from "@/admin/payload/db/id-utils"

/*************************************************************************/
/*  MINIMAL PAGES DATA
/*
/*  Creates 4 blank pages with no sections for minimal profile:
/*  - Home
/*  - Contact  
/*  - Privacy Policy
/*  - Terms
/*
/*  All pages are empty (no sections) - ready for client customization
/*************************************************************************/

export const minimalPages = async (
  payload: Payload,
  context?: any,
  contactForm?: Form
): Promise<Array<Omit<Page, "updatedAt" | "id" | "createdAt">>> => {
  return [
    {
      title: "Home",
      slug: "home",
      _status: "published",
      sections: [
        {
          blockType: "hero-simple",
          heading: "Welcome",
          content: createRichText([paragraph("You're ready to build.")]),
          align: "center",
        },
        {
          blockType: "content",
          content: createRichText([
            paragraph(
              "Start by assembling pages with sections. In the admin, open Pages → Home and add sections like Hero, Text/Image, and Content. Drag to reorder and publish."
            ),
            paragraph(
              "To customize components, work in src/components/sections. Each section has a config.ts (fields) and a Component.tsx (render). Register new sections in sections/config.ts and sections/sections-map.tsx."
            ),
            paragraph(
              "Global behavior (media provider, features) is set in src/smartsite.config.ts. Use minimal sections as a starting point, then expand with blocks from the library or your own."
            ),
          ]),
        },
      ],
      publishedAt: new Date().toISOString(),
    },
    {
      title: "Contact",
      slug: "contact", 
      _status: "published",
      sections: [
        {
          blockType: "hero-simple",
          heading: "Contact",
          content: createRichText([paragraph("We'd love to hear from you.")]),
          align: "center",
        },
        ...(contactForm
          ? [
              {
                blockType: "contact-form-simple",
                // Ensure relationship ID is a string to satisfy generated types
                form: String(contactForm.id),
              } as ContactFormSimpleBlock,
            ]
          : []),
      ],
      publishedAt: new Date().toISOString(),
    },
    {
      title: "Privacy Policy",
      slug: "privacy-policy",
      _status: "published",
      sections: [
        {
          blockType: "hero-simple",
          heading: "Privacy Policy",
          content: createRichText([paragraph("")]),
          align: "center",
        },
        {
          blockType: "content",
          content: createRichText([paragraph("Add your privacy policy content here.")]),
        },
      ],
      publishedAt: new Date().toISOString(),
    },
    {
      title: "Terms",
      slug: "terms",
      _status: "published",
      sections: [
        {
          blockType: "hero-simple",
          heading: "Terms & Conditions",
          content: createRichText([paragraph("")]),
          align: "center",
        },
        {
          blockType: "content",
          content: createRichText([paragraph("Add your terms and conditions here.")]),
        },
      ],
      publishedAt: new Date().toISOString(),
    },
  ]
}
