import type { Payload } from "payload"
import { createRichText, heading, paragraph } from "@/admin/utilities/rich-text-builder"

type SeedForm = { id: string | number }
type SeedPage = Record<string, unknown>

/*************************************************************************/
/*  MINIMAL PAGES DATA
/*
/*  Provides a launch-ready baseline of core pages when seeding:
/*  - Home
/*  - About
/*  - Contact
/*  - Privacy Policy
/*  - Terms
/*
/*  Pages ship with lean sections that demonstrate the canonical blocks
/*  without introducing brand-specific assets.
/*************************************************************************/

export const minimalPages = async (
  _payload: Payload,
  _context?: unknown,
  contactForm?: SeedForm
): Promise<SeedPage[]> => {
  return [
    {
      title: "Home",
      slug: "home",
      _status: "published",
      sections: [
        {
          blockType: "hero",
          heading: "Launch your next site",
          supportingText: createRichText([
            paragraph("Start from a clean foundation and publish as you go."),
          ]),
          alignment: "left",
          size: "medium",
          sectionSettings: {
            colorScheme: "neutral",
          },
        },
        {
          blockType: "content",
          content: createRichText([
            heading("What you get out of the box", { tag: "h2" }),
            paragraph(
              "Use the Page builder to compose sections for each screen. Adjust settings, colours, and layout directly within the Section Settings group."
            ),
            paragraph(
              "Need more blocks? Extend the sections directory or install from the library. Every section is self-contained and powered by this shared Section component."
            ),
            paragraph(
              "Global configuration lives in smartsite.config.ts. Update navigation, colours, and analytics when you are ready to move past this starting point."
            ),
          ]),
          layout: "stacked",
          alignment: "start",
          showButton: false,
          showMedia: false,
          sectionSettings: {
            colorScheme: "light",
          },
        },
      ],
      publishedAt: new Date().toISOString(),
    },
    {
      title: "About",
      slug: "about",
      _status: "published",
      sections: [
        {
          blockType: "hero",
          heading: "About your team",
          supportingText: createRichText([
            paragraph("Introduce your story, values, and the people behind the brand."),
          ]),
          alignment: "left",
          size: "medium",
          sectionSettings: {
            colorScheme: "neutral",
          },
        },
        {
          blockType: "content",
          content: createRichText([
            heading("Share the essentials", { tag: "h2" }),
            paragraph(
              "This page is a great place to outline what you do, who you serve, and why the work matters."
            ),
            paragraph(
              "Use additional sections to highlight services, testimonials, or team members once you are ready."
            ),
          ]),
          layout: "columns",
          alignment: "start",
          showMedia: false,
          sectionSettings: {
            colorScheme: "light",
          },
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
          blockType: "hero",
          heading: "Contact",
          supportingText: createRichText([paragraph("We would love to hear from you.")]),
          alignment: "left",
          size: "medium",
          sectionSettings: {
            colorScheme: "neutral",
          },
        },
        {
          blockType: "content",
          content: createRichText([
            heading("Stay in touch", { tag: "h2", format: "center" }),
            paragraph("Prefer email or a quick call? Add your preferred contact details here.", {
              format: "center",
            }),
            paragraph(
              "The form below routes submissions to the email address configured in Forms.",
              { format: "center" }
            ),
          ]),
          layout: "stacked",
          alignment: "center",
          sectionSettings: {
            colorScheme: "light",
          },
        },
        ...(contactForm
          ? [
              {
                blockType: "contact-form",
                form: String(contactForm.id),
                variant: "white",
                layout: "split",
                supportingContent: createRichText([
                  paragraph("Complete the form and we'll reply within one business day."),
                ]),
                sectionSettings: {
                  colorScheme: "light",
                },
              },
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
          blockType: "hero",
          heading: "Privacy Policy",
          supportingText: createRichText([
            paragraph("Understand how your customer data is collected and protected."),
          ]),
          alignment: "left",
          size: "small",
          sectionSettings: {
            colorScheme: "neutral",
          },
        },
        {
          blockType: "content",
          content: createRichText([paragraph("Add your privacy policy content here.")]),
          layout: "stacked",
          alignment: "start",
          sectionSettings: {
            colorScheme: "light",
          },
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
          blockType: "hero",
          heading: "Terms & Conditions",
          supportingText: createRichText([
            paragraph("Review the agreements that guide working with your business."),
          ]),
          alignment: "left",
          size: "small",
          sectionSettings: {
            colorScheme: "neutral",
          },
        },
        {
          blockType: "content",
          content: createRichText([paragraph("Add your terms and conditions here.")]),
          layout: "stacked",
          alignment: "start",
          sectionSettings: {
            colorScheme: "light",
          },
        },
      ],
      publishedAt: new Date().toISOString(),
    },
  ]
}
