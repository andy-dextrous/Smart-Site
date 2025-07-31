# CLAUDE.md - Smart Site Application

This file provides guidance for Claude Code when working specifically within the `apps/smart-site/` application.

## Application Overview

This is a **section-first, field-driven website builder** using Next.js 15, Payload CMS, Tailwind v4, and GSAP. The architecture is designed for 90% of development time to be spent building reusable sections from designs.

## 🚨 CRITICAL - Admin Folder Protection

**NEVER modify files in `src/admin/`** when working on client sites:

- **Admin folder is core product code** - only modify when developing the master branch
- **ALL admin customizations** must go through `smartsite.config.ts` configuration
- **Admin updates override local changes** - use config system to preserve customizations

## Smart Site Architecture

### Route Groups Structure

**Critical separation pattern**:

- **`(frontend)/`** - Public website routes, CSS, and frontend logic
- **`(payload)/`** - CMS admin dashboard routes and API endpoints

### Directory Organization

**Admin Layer** (`src/admin/`):
- `payload/` - Complete CMS configuration separated from frontend
- `lib/` - Admin server actions, routing, and caching utilities  
- `utilities/` - Admin-specific utility functions
- `components/` - Admin dashboard components

**Frontend Layer**:
- `src/components/` - Public website components → [See CLAUDE.md](./src/components/CLAUDE.md)
- `src/components/sections/` - All page sections (primary development area) → [See CLAUDE.md](./src/components/sections/CLAUDE.md)
- `src/app/(frontend)/` - Public routes and pages
- `src/utilities/` - Frontend-only utilities

### Admin/Frontend Separation Rules

**CRITICAL - Never mix these layers**:

- **Admin components** should NEVER be used in frontend routes
- **Frontend components** should NEVER be used in admin routes
- **Utilities are separated** - check the correct folder before importing
- **Updates override warning**: When updating smart-site, the entire `/admin` folder gets replaced - use `smartsite.config.ts` for customizations

## SmartSite Configuration System

The `smartsite.config.ts` provides a powerful override system for customizing Payload collections, globals, and blocks without modifying core files.

### Boolean Override Pattern

**Disable default features**:

```typescript
// smartsite.config.ts
const smartSiteConfig = defineConfig({
  // Disable unwanted default collections
  collections: [
    { services: false, team: false }, // Remove services & team collections
    CustomProducts, // Add your custom collection
  ],

  // Disable default globals  
  globals: [
    { footer: false }, // Remove footer global
    CustomSettings,    // Add custom global
  ],

  // Disable default blocks
  blocks: [
    { form: false },     // Remove form block
    { hero: false },     // Remove default hero
    CustomHeroBlock,     // Add custom hero
  ],
})
```

### Enhanced Configuration Options

**Advanced Payload configuration**:

```typescript
const smartSiteConfig = defineConfig({
  // Payload-specific config
  payload: {
    cors: ["https://yourdomain.com"],
    rateLimit: {
      trustProxy: true,
      window: 900000, // 15 minutes
      max: 1000,
    },
    csrf: ["https://yourdomain.com"],
  },

  // Media storage options
  media: {
    storage: "vercel-blob", // or "local", "s3", "cloudinary"
    collections: ["media", "documents"],
  },

  // Frontend options
  frontend: {
    enableFrontend: true, // Enable public routes
    revalidation: 60,     // ISR revalidation time
  },
})
```

### Configuration Integration

**How the config system works**:

1. **Smart-site core** provides default collections, globals, and blocks
2. **Your config** overrides/extends these defaults using boolean flags
3. **System merges** your customizations with core functionality
4. **Updates preserve** your customizations by keeping config separate

## Smart Site Patterns

### Server Actions Architecture

**Admin server actions** (`src/admin/lib/`):
- Handle all database operations via Payload Local API
- Manage authentication and authorization
- Process form submissions and data mutations
- Cache management and revalidation

**Frontend utilities** (`src/utilities/`):
- Client-side helper functions only
- No database access or server operations
- UI utilities and formatting functions

### Type Generation

**Payload automatically generates types** - never create them manually:

```bash
# Types are generated automatically when Payload starts
# Access them via:
import type { Page, Post } from "@/admin/payload/payload-types"
```

### Integration with Monorepo

This app integrates with the broader monorepo structure:
- **Shared packages** are automatically linked via pnpm workspace
- **CLI tool** can install components from blocks-library into this app
- **AI agents** in smart-site-ai can interact with this app's content
- **Deployment** is handled independently from other apps
