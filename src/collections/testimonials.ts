import { refreshRelatedContent, refreshDeletedContent } from "@/website/publication/hooks"
import { CollectionConfig } from "payload"
import { anyone } from "@/access/anyone"
import { canEditContent } from "@/access/editor"
import { CollectionCustomMetadata } from "@/types/icon-types"

export const Testimonials: CollectionConfig = {
  hooks: { afterChange: [refreshRelatedContent], afterDelete: [refreshDeletedContent] },
  slug: "testimonials",
  custom: { smartsite: { mcp: true } },
  enableQueryPresets: true,
  trash: true,
  access: {
    create: canEditContent,
    delete: canEditContent,
    read: anyone,
    update: canEditContent,
  },
  labels: {
    singular: "Testimonial",
    plural: "Testimonials",
  },
  admin: {
    useAsTitle: "name",
    description:
      "Client testimonials displayed on the website. Each testimonial includes a quote, client information, and company logo.",
    custom: {
      icon: {
        type: "react-icons",
        name: "md/MdReviews",
      },
    } as CollectionCustomMetadata,
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      admin: {
        description: "Full name of the person giving the testimonial",
      },
    },
    {
      name: "title",
      type: "text",
      required: true,
      admin: {
        description: "Job title of the person (e.g., 'Head of Digital Transformation')",
      },
    },
    {
      name: "quote",
      type: "textarea",
      required: true,
      admin: {
        description: "The testimonial quote from the client",
      },
    },
    {
      name: "company",
      type: "text",
      required: true,
      admin: {
        description: "Company name",
      },
    },
    {
      name: "companyLogo",
      label: "Company Logo",
      type: "upload",
      relationTo: "media",
      required: true,
      admin: {
        description:
          "Company logo image - will be displayed as a small icon in the testimonial",
      },
    },
    {
      name: "featured",
      type: "checkbox",
      defaultValue: false,
      admin: {
        description: "Mark as featured to prioritize in displays",
      },
    },
  ],
}
