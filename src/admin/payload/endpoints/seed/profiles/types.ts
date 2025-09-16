/*************************************************************************/
/*  SEED PROFILE TYPES
/*
/*  Defines the structure for different seeding profiles that control
/*  what content gets created during database initialization.
/*
/*  Profiles:
/*  - minimal: Clean start with essentials only (DEFAULT)
/*************************************************************************/

export type ProfileName = "minimal"

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
    pages: "minimal"
    
    // Globals with different configurations
    globals: {
      settings: "minimal"
      header: "minimal"  
      footer: "minimal"
    }
  }
}
