import type { SeedProfile } from "./types"

/*************************************************************************/
/*  MINIMAL SEED PROFILE
/*
/*  Essential starter configuration for production sites.
/*  Creates only the bare necessities:
/*  - Admin user account
/*  - 4 blank pages (home, contact, privacy, terms) with NO sections
/*  - Minimal navigation (home, contact)
/*  - Minimal footer (legal links)
/*  - Basic SEO defaults
/*
/*  This is the DEFAULT profile - 99% of client projects start here
/*************************************************************************/

export const minimalProfile: SeedProfile = {
  name: "minimal",
  description: "Essential starter - blank pages, minimal navigation, SEO defaults",
  
  seedFunctions: {
    // Core requirements
    users: true,              // Admin user for login
    
    // Skip all demo content
    categories: false,
    forms: true,
    templates: false,
    media: false,
    testimonials: false,
    services: false,
    posts: false,
    
    // Minimal pages (blank, no sections)
    pages: "minimal",
    
    // Minimal globals
    globals: {
      settings: "minimal",    // SEO defaults, site name
      header: "minimal",      // Home, Contact links only
      footer: "minimal",      // Privacy, Terms links only
    },
  },
}
