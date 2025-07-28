import type { Payload } from "payload"
import type { Testimonial } from "@/admin/payload/payload-types"
import { downloadImages, type ImageSet } from "../utils/image-downloader"

/*************************************************************************/
/*  TECHNOLOGY CLIENT TESTIMONIALS IMAGES
/*************************************************************************/

const images: ImageSet = {
  techFlowLogo: {
    url: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&w=400&q=80",
    alt: "TechFlow Solutions company logo",
    caption: "TechFlow Solutions - Technology Infrastructure Partners",
    filename: "techflow-logo.jpg",
  },
  innovateTechLogo: {
    url: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?ixlib=rb-4.0.3&w=400&q=80",
    alt: "InnovateTech company logo",
    caption: "InnovateTech - Digital Innovation Leaders",
    filename: "innovatetech-logo.jpg",
  },
  dataDrivenLogo: {
    url: "https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&w=400&q=80",
    alt: "DataDriven Co company logo",
    caption: "DataDriven Co - Analytics and Insights Experts",
    filename: "datadriven-logo.jpg",
  },
}

/*************************************************************************/
/*  TECHNOLOGY CLIENT TESTIMONIALS DATA
/*************************************************************************/

export const technologyClientTestimonials = async (
  payload: Payload,
  context?: any
): Promise<Omit<Testimonial, "updatedAt" | "id" | "createdAt">[]> => {
  // Download images specific to testimonials
  const media = await downloadImages(payload, images, context)

  return [
    {
      name: "Sarah Johnson",
      title: "CTO",
      company: "TechFlow Solutions",
      quote:
        "Smart Site transformed our website from a static brochure into an intelligent business partner. The AI-powered features and 10x performance improvement exceeded all our expectations.",
      companyLogo: media.techFlowLogo?.id || null,
      featured: true,
    },
    {
      name: "Michael Chen",
      title: "CEO",
      company: "InnovateTech",
      quote:
        "Working with Smart Site was a revelation. Our website now creates content, optimizes SEO, and drives leads automatically. It's like having an entire marketing team built into our site.",
      companyLogo: media.innovateTechLogo?.id || null,
      featured: true,
    },
    {
      name: "Emily Rodriguez",
      title: "Head of Operations",
      company: "DataDriven Co",
      quote:
        "Smart Site's AI-native platform delivers incredible performance and intelligent automation. Our website engagement increased 300% and conversions doubled within the first month.",
      companyLogo: media.dataDrivenLogo?.id || null,
      featured: false,
    },
  ]
}
