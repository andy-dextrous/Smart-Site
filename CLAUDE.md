# Smart Site Starter - Client Site Template

⚠️ **CRITICAL: This is a CLIENT SITE TEMPLATE - Admin folder is OFF-LIMITS** ⚠️

**DO NOT MODIFY `/src/admin/` DIRECTORY UNDER ANY CIRCUMSTANCES**

A field-driven, section-first website building system built on Next.js 15, Payload CMS 3, Tailwind CSS v4, and GSAP. This template provides a complete CMS with O(1) URI resolution, intelligent caching, and AI integration.

## System Identification

**Type**: Client Site Template
**Location**: `apps/smart-site-starter/`
**Purpose**: Clean starting point for client websites
**STRICT RULE**: `/src/admin/` directory is PROTECTED - updates will completely replace it

📖 **IMPORTANT**: Read the README.md file in this directory to understand:
- How the SmartSite configuration system works
- Available configuration options
- How to properly customize without touching admin
- The three-tier architecture (master → starter → client)

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

📖 **See README.md for detailed configuration documentation**

**YOU HAVE FULL CONTROL** through configuration and extensions - NO need to touch admin!

```typescript
const config: UserConfig = {
  // Collections configuration - enable/disable/customize
  collections: {
    pages: { enabled: true, frontend: true, seo: true },
    services: { enabled: false },  // Disable unwanted
    // Control ALL collections without touching admin
  },
  
  // Feature flags - complete control
  features: {
    ai: { enabled: true, endpoint: "http://localhost:4112" },
    darkMode: false,
    sitemaps: true,
  },
  
  // Admin customization - theme, layout, metadata
  admin: {
    theme: { colors: { accent: "#4f37fb" } },
    meta: { title: "Custom Admin Title" },
  },
  
  // Image optimization settings
  images: {
    quality: { default: 85, hero: 90 },
    sizes: [
      { name: "thumbnail", width: 300 },
      { name: "large", width: 1400 },
    ],
  },
  
  // GSAP plugins
  gsap: {
    scrollTrigger: true,
    scrollSmoother: true,
  },
  
  // POWERFUL EXTENSION SYSTEM - Add ANY custom functionality
  extensions: {
    collections: [],  // Add custom collections
    blocks: [],       // Add custom blocks
    globals: [],      // Add custom globals
    plugins: [],      // Add Payload plugins
    // Extensions can override ANYTHING - full power!
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

### 3. ⚠️ CRITICAL: Admin Layer is OFF-LIMITS (`src/admin/`)

**ABSOLUTELY NO MODIFICATIONS ALLOWED IN `/src/admin/`**

The admin directory is PROTECTED and will be COMPLETELY REPLACED during updates:

- **🚫 NEVER modify** ANY files in `/src/admin/` - NO EXCEPTIONS
- **🚫 NEVER add** new files to `/src/admin/`
- **🚫 NEVER delete** files from `/src/admin/`
- **✅ ONLY use configuration** in `smartsite.config.ts` for ALL customizations
- **✅ Extensions MUST go in** `/src/extensions/`
- **✅ Frontend code MUST go in** `/src/components/`

**If you need admin changes**: Submit a PR to the Wild Creative product studio repository

### 4. Extension System (`src/extensions/`)

**YOU CAN EXTEND AND OVERRIDE ANYTHING** - Without touching admin!

The extension system gives you FULL POWER to customize:

```typescript
// src/extensions/ directory structure
extensions/
├── blocks/         # Custom content blocks
├── collections/    # Custom collections (products, events, etc.)
├── components/     # Override admin components
├── globals/        # Custom global configurations
└── plugins/        # Payload plugins

// Register extensions in smartsite.config.ts
extensions: {
  collections: [
    // Add complete custom collections
    {
      slug: "products",
      fields: [...],
      admin: { group: "Commerce" }
    }
  ],
  blocks: [
    // Add custom blocks to pages
    MyCustomBlock,
    VideoGalleryBlock,
  ],
  globals: [
    // Add global settings
    SocialMediaConfig,
    IntegrationsConfig,
  ],
  plugins: [
    // Add Payload plugins
    formBuilderPlugin(),
    seoPlugin({ /* config */ }),
  ],
}
```

**Extension Capabilities**:
- ✅ Add ANY custom collections (products, events, portfolios)
- ✅ Create custom blocks for unique content types
- ✅ Override default behavior with plugins
- ✅ Add custom admin UI components
- ✅ Integrate third-party services
- ✅ Extend without modifying core admin code

### 5. URI Resolution System

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
// ✅ CORRECT - Use smartsite.config.ts ONLY
const config: UserConfig = {
  collections: { services: { enabled: false } },
}

// 🚫 ABSOLUTELY FORBIDDEN - Modifying admin files
// NEVER touch ANY file in src/admin/
// Updates will DELETE your changes
```

### ⚠️ High-Risk Modifications

**Never modify these**:

- **`src/admin/`** - Entire directory is replaced on updates
- **Generated types** - Let Payload generate `payload-types.ts`
- **URI Index** - Managed automatically by hooks
- **Cache keys** - Breaking cache invalidation patterns
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

## 💪 Key Capabilities - You Have Full Control!

Despite the admin restrictions, you have COMPLETE CONTROL through:

### Configuration Power (`smartsite.config.ts`)
- **Collections**: Enable/disable any collection, control SEO, sitemaps, frontend features
- **Features**: AI chat, dark mode, i18n, analytics, search - all configurable
- **Admin Theme**: Colors, layout, typography, metadata - fully customizable
- **Image Optimization**: Quality, sizes, breakpoints - all configurable
- **GSAP Plugins**: Enable ScrollTrigger, ScrollSmoother, and more
- **Media Storage**: Local, Vercel Blob, S3 - switch providers easily

### Extension System (`src/extensions/`)
- **Custom Collections**: Add products, events, portfolios, anything!
- **Custom Blocks**: Create unique content blocks
- **Custom Globals**: Add site-wide settings
- **Payload Plugins**: Integrate any Payload plugin
- **Override Components**: Replace default admin components

### Field-Driven Architecture
- **Reusable Field Patterns**: `sectionIntro()`, `sectionCta()`, `button()`, etc.
- **Type Safety**: Automatic TypeScript generation
- **20+ Pre-built Sections**: Hero, CTA, forms, grids, testimonials
- **Two-file Pattern**: config.ts + Component.tsx for each section

### Development Commands
```bash
pnpm dev              # Start development
pnpm seed             # Seed with demo data
pnpm generate:types   # Generate TypeScript types
pnpm mongo:start      # Start MongoDB
pnpm regenerate-uris  # Regenerate URI index
```

## 🚫 CRITICAL CLIENT SITE RULES

⚠️ **DO NOT MODIFY `/src/admin/` - IT WILL BE DELETED** - The ENTIRE admin folder is replaced on updates

⚠️ **USE CONFIG & EXTENSIONS** - You have FULL CONTROL through smartsite.config.ts and extensions

⚠️ **NEVER CREATE PAYLOAD TYPES MANUALLY** - Always use generated types from `payload-types.ts`

⚠️ **SECTIONS MUST FOLLOW TWO-FILE PATTERN** - `config.ts` + `Component.tsx` in kebab-case folder

⚠️ **NEED ADMIN CORE CHANGES?** - Submit a PR to github.com/andy-dextrous/ai-product-studio

📖 **ALWAYS READ THE README.md** - Complete configuration reference and examples

**REMEMBER**: This is a CLIENT SITE with FULL CUSTOMIZATION POWER through configuration and extensions. The admin core is protected, but you can override and extend ANYTHING without touching it.
