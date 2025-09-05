/*************************************************************************/
/*  SEED PROFILE TYPES
/*
/*  Defines the structure for different seeding profiles that control
/*  what content gets created during database initialization.
/*
/*  Profiles:
/*  - minimal: Clean start with essentials only (DEFAULT)
/*  - demo: Full showcase with all features (current implementation)
/*************************************************************************/

export type ProfileName = "minimal" | "demo"

export interface SeedProfile {
  name: ProfileName
  description: string
  
  // Control which seed functions run
  seedFunctions: {
    // Core data
    users: boolean
    
    // Content collections  
    categories: boolean
    forms: boolean
    templates: boolean
    media: boolean
    testimonials: boolean
    services: boolean
    posts: boolean
    
    // Pages with different content levels
    pages: "minimal" | "demo"
    
    // Globals with different configurations
    globals: {
      settings: "minimal" | "full"
      header: "minimal" | "full"  
      footer: "minimal" | "full"
    }
  }
}