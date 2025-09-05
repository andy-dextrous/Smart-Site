import type { SeedProfile } from "./types"

/*************************************************************************/
/*  DEMO SEED PROFILE
/*
/*  Full showcase configuration with all current content.
/*  This is the existing seed implementation that demonstrates
/*  all features and capabilities.
/*
/*  Includes:
/*  - All 5 pages with full sections
/*  - Services, posts, testimonials
/*  - Complete navigation with dropdowns
/*  - Full settings with social links
/*  - All demo content and media
/*
/*  Use for testing, showcasing capabilities, and client demos
/*************************************************************************/

export const demoProfile: SeedProfile = {
  name: "demo",
  description: "Full demo website - all sections, services, blog, testimonials",
  
  seedFunctions: {
    // Everything enabled (current seed behavior)
    users: true,
    categories: true,
    forms: true,
    templates: true,
    media: true,
    testimonials: true,
    services: true,
    posts: true,
    
    // Full pages with all sections
    pages: "demo",
    
    // Full globals with all configuration
    globals: {
      settings: "full",
      header: "full",
      footer: "full",
    },
  },
}