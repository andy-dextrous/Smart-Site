# Smart Site System Architecture

**Enterprise Website Builder - Master Development Environment**

A field-driven, section-first website building system built on Next.js 15, Payload CMS 3, Tailwind CSS v4, and GSAP. This system provides a complete CMS with O(1) URI resolution, intelligent caching, and AI integration. This is the master development environment where all new features and core functionality are built.

## System Identification

**Type**: Master Development System
**Location**: `apps/smart-site/`
**Purpose**: Core development and innovation for Smart Site platform
**Environment**: Full demo data and all sections for realistic testing

## Technical Architecture

### Core Files
- **`src/smartsite.config.ts`** - User configuration entry point
- **`src/admin/config/defaults.ts`** - Complete configuration schema
- **`src/admin/config/resolver.ts`** - Configuration resolution engine
- **`src/admin/payload/payload.config.ts`** - Generated Payload configuration
- **`src/app/(frontend)/[[...uri]]/page.tsx`** - Dynamic route handler

### Main Process Flow

```typescript
// 1. User defines configuration
const config: UserConfig = {
  collections: { services: { enabled: false } },
  features: { ai: { enabled: true } },
}

// 2. Resolver merges with defaults
resolveConfiguration(config) → {
  collections: [...defaultCollections, ...userCollections],
  features: { ...defaultFeatures, ...userFeatures },
}

// 3. Frontend request hits catch-all route
/about → [[...uri]]/page.tsx → URI Index lookup → Render page
```

### What the System Provides

✅ **O(1) URI resolution** - Single database query for any URL
✅ **Field-driven architecture** - CMS fields generate UI automatically  
✅ **Smart caching** - Intelligent invalidation and dependency tracking
✅ **Section isolation** - Each section is self-contained
✅ **Safe updates** - Admin layer updates preserve customizations
✅ **AI integration** - Chat assistant and content generation

## Integration Points

### 1. Configuration System (`smartsite.config.ts`)

Controls all aspects without modifying core files:

```typescript
const config: UserConfig = {
  // Collections configuration
  collections: {
    pages: { enabled: true, frontend: true, seo: true },
    services: { enabled: false },  // Disable unwanted
  },
  
  // Feature flags
  features: {
    ai: { enabled: true, endpoint: "http://localhost:4112" },
    darkMode: false,
    sitemaps: true,
  },
  
  // GSAP plugins
  gsap: {
    scrollTrigger: true,
    scrollSmoother: true,
  },
  
  // Extensions
  extensions: {
    collections: [],  // Custom collections
    blocks: [],       // Custom blocks
  },
}
```

### 2. Section Development (`src/components/sections/`)

Every section requires two files:

```typescript
// config.ts - Field definitions
export const HeroBanner: Block = {
  slug: "hero-banner",
  interfaceName: "HeroBannerBlock",
  fields: [
    sectionIntro(),  // Reusable field group
    sectionCta(),
    { name: "backgroundImage", type: "upload", relationTo: "media" },
  ],
}

// Component.tsx - React component
export function HeroBannerComponent(props: HeroBannerBlock) {
  return <section>...</section>
}
```

### 3. Admin Layer Development (`src/admin/`)

The core admin system where Smart Site backend is developed:

- **Core Payload configuration** and CMS setup
- **Backend components** and dashboard UI
- **Caching and routing** infrastructure
- **AI integration** and chat components

### 4. URI Resolution System

O(1) constant-time URL lookups:

```typescript
// URI Index maintains pre-computed mappings
/about → { collection: "pages", slug: "about", id: "..." }
/blog/my-post → { collection: "posts", slug: "my-post", id: "..." }

// Single query resolution in [[...uri]]/page.tsx
const doc = await cache.getByURI(uri)  // One database hit
```

## Risk-Based Development Guidelines

### ⚠️ High-Impact Files

Files that affect the entire system:

- **`src/admin/payload/payload.config.ts`** - Main Payload configuration
- **`src/admin/config/defaults.ts`** - Configuration schema
- **`src/admin/config/resolver.ts`** - Resolution engine
- **`src/app/(frontend)/[[...uri]]/page.tsx`** - All frontend routing
- **`src/smartsite.config.ts`** - User configuration

### ✅ Recommended Patterns

**Section Creation**:
```typescript
// ✅ CORRECT - Use two-file pattern
src/components/sections/hero-banner/
├── config.ts       # Payload fields
└── Component.tsx   # React component

// ❌ WRONG - Single file or wrong location
src/sections/HeroBanner.tsx  # Wrong location and casing
```

**Field Reuse**:
```typescript
// ✅ CORRECT - Use field functions
import { sectionIntro, sectionCta, button } from "@/components/fields"

fields: [
  sectionIntro({ collapsibleLabel: "Hero Content" }),
  sectionCta(),
]

// ❌ WRONG - Duplicate field definitions
fields: [
  { name: "heading", type: "text" },  // Recreating existing patterns
]
```

**Configuration**:
```typescript
// Use smartsite.config.ts for user-facing configuration
const config: UserConfig = {
  collections: { services: { enabled: false } },
}

// Modify admin files directly for core development
// src/admin/payload/payload.config.ts for Payload setup
```

### Development Best Practices

**Key areas to understand**:

- **Generated types** - Let Payload generate `payload-types.ts`
- **URI Index** - Managed automatically by hooks
- **Cache keys** - Maintain cache invalidation patterns
- **Route resolution** - The `[[...uri]]` handler is optimized

## 🔧 Utility Functions Reference

### Cache Utilities (`src/admin/cache/`)
```typescript
import { cache } from "@/admin/cache"

// O(1) URI lookup
const page = await cache.getByURI("/about")

// Get by collection and slug
const post = await cache.getBySlug("posts", "my-post")

// Revalidate cache
await revalidate({ collection: "pages", doc })
```

### Field Patterns (`src/components/fields/`)
```typescript
import { sectionIntro, sectionCta, button, buttonsGroup, link } from "@/components/fields"

// Pre-built field groups with consistent patterns
sectionIntro({ collapsibleLabel: "Content" })
buttonsGroup({ max: 3 })
```

### Media Components (`src/admin/payload/components/frontend/media/`)
```typescript
import { Media } from "@/admin/payload/components/frontend/media"

// Responsive image/video component
<Media resource={mediaObject} fill className="object-cover" />
```

## System Dependencies

**Configuration Files** (3):
- `smartsite.config.ts`
- `admin/config/defaults.ts`
- `admin/config/resolver.ts`

**Collection Files** (10+):
- `pages.ts`, `posts.ts`, `services.ts`
- `team.ts`, `categories.ts`, `media.ts`
- `testimonials.ts`, `templates.ts`
- `users.ts`, `uri-index.ts`

**Section Files** (20+):
- Each section has `config.ts` and `Component.tsx`
- Registered in `sections-map.tsx` and `config.ts`

**Field Groups** (10+):
- `sectionIntro`, `sectionCta`, `button`
- `buttonsGroup`, `link`, `mediaWithOptions`

## Troubleshooting

### Common Issues & Solutions

1. **Sections not appearing in admin**:
   - Check registration in `src/components/sections/config.ts`
   - Verify component mapping in `sections-map.tsx`
   - Restart dev server after adding sections

2. **Types not generating**:
   - Run `pnpm generate:types`
   - Check database connection
   - Verify Payload is running

3. **Admin changes lost after update**:
   - Use `smartsite.config.ts` for all customizations
   - Move custom code to `/src/extensions/`
   - Never modify `/src/admin/` directly

4. **URI resolution failing**:
   - Run `pnpm regenerate-uris`
   - Check URI Index collection in database
   - Verify page has a slug field

5. **Build failures**:
   - Run `pnpm type-check`
   - Check for missing imports
   - Verify all sections are properly typed

## Development Guidelines

✅ **MASTER DEVELOPMENT ENVIRONMENT** - All core Smart Site features are built here

✅ **UPDATE ADMIN PACKAGE.JSON VERSION** - When making admin changes, ALWAYS update `src/admin/package.json` version

✅ **NEVER CREATE PAYLOAD TYPES MANUALLY** - Always use generated types from `payload-types.ts`

✅ **TEST WITH DEMO DATA** - Full demo content ensures features work in production

✅ **SECTIONS MUST FOLLOW TWO-FILE PATTERN** - `config.ts` + `Component.tsx` in kebab-case folder

## 📦 CRITICAL: Admin Package.json Updates

**When making ANY changes to the admin layer, you MUST:**

1. **Update the version** in `src/admin/package.json`:
   ```json
   {
     "version": "1.1.2",  // Increment this!
     "releaseDate": "2025-01-05",  // Update date
   }
   ```

2. **Update sharedDependencies** if adding new packages:
   ```json
   "sharedDependencies": {
     "@new-package": "^1.0.0",  // Add any new required packages
   }
   ```

3. **Sync to starter** using: `pnpm sync:to-starter`

This ensures:
- Version tracking for releases
- Proper dependency management
- Client sites get all required packages

Remember: This is the innovation lab where all Smart Site features start. Work with real demo data to ensure features work in production scenarios.
