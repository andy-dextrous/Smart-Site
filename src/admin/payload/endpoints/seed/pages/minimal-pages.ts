import type { Payload } from "payload"
import type { Page } from "@/admin/payload/payload-types"

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
  context?: any
): Promise<Array<Omit<Page, "updatedAt" | "id" | "createdAt">>> => {
  return [
    {
      title: "Home",
      slug: "home",
      _status: "published",
      sections: [], // Empty - no sections
      publishedAt: new Date().toISOString(),
    },
    {
      title: "Contact",
      slug: "contact", 
      _status: "published",
      sections: [], // Empty - no sections
      publishedAt: new Date().toISOString(),
    },
    {
      title: "Privacy Policy",
      slug: "privacy-policy",
      _status: "published",
      sections: [], // Empty - no sections
      publishedAt: new Date().toISOString(),
    },
    {
      title: "Terms",
      slug: "terms",
      _status: "published",
      sections: [], // Empty - no sections
      publishedAt: new Date().toISOString(),
    },
  ]
}