# CLAUDE.md - Smart Site

This file provides guidance for Claude Code when working specifically within the `apps/smart-site/` application.

## Application Overview

This is a **section-first, field-driven website builder** using Next.js 15, Payload CMS, Tailwind v4, and GSAP. The architecture is designed for 90% of development time to be spent building reusable sections from designs.

### Core Architecture

**Route Groups**:
- `(frontend)/` - Public website routes, CSS, and frontend logic
- `(payload)/` - CMS admin dashboard routes and API endpoints

**Key Directories**:
- `src/components/sections/` - All page sections (primary development area)
- `src/admin/payload/` - CMS configuration separated from frontend
- `src/admin/lib/` - Admin server actions, routing, and caching utilities
- `src/utilities/` - Frontend utilities
- `src/admin/utilities/` - Admin-specific utilities

### Admin/Frontend Separation

**Critical**: Admin and frontend code are completely separated:
- **Admin Layer**: `src/admin/` contains all Payload CMS, server actions, routing logic
- **Frontend Layer**: `src/components/`, `src/app/(frontend)/` contains public website code
- **Never mix**: Admin components shouldn't be used in frontend routes

## Sections Config System

**Unified Configuration**: Sections use a centralized registration system:

1. **Config Registration**: `src/components/sections/config.ts` exports `sectionBlocks` array
2. **Component Mapping**: `src/components/sections/sections-map.tsx` maps block types to React components  
3. **Rendering**: `src/admin/components/render-sections.tsx` handles server-side rendering

This replaces the old pattern of importing into separate files.

## Tailwind v4 Implementation

### CSS-First Configuration

All Tailwind config is in CSS files, not JavaScript:
- `src/app/(frontend)/css/globals.css` - Entry point
- `src/app/(frontend)/css/theme.css` - Colors and design tokens
- `src/app/(frontend)/css/typography.css` - Site-wide typography
- `src/app/(frontend)/css/components.css` - Custom component classes

### Typography Rules

**NEVER apply typography styles directly to components**:
- ❌ `className="text-2xl font-bold leading-tight"`
- ✅ Use design system classes or let typography.css handle defaults

### Key Tailwind v4 Features

- **CSS Import**: `@import "tailwindcss"` (not `@tailwind` directives)
- **Theme Variables**: `--color-blue-500`, `--font-sans` etc.
- **Container Queries**: `@container`, `@sm:`, `@md:` etc.
- **3D Transforms**: `transform-3d`, `rotate-x-*`, `perspective-*`
- **Gradient Syntax**: `bg-linear-45`, `bg-conic`, `bg-radial-[at_25%_25%]`

## GSAP Animation Integration

### Setup Requirements

1. **Config**: Set `gsap: true` in `src/smartsite.config.ts`
2. **Provider**: Import from `@/providers/gsap` (not node_modules)
3. **Client Component**: Add `"use client"` to animated components

### Animation Pattern

```typescript
import { useGSAP, gsap } from "@/providers/gsap"
import { useRef } from "react"

const sectionRef = useRef<HTMLDivElement>(null)

useGSAP(
  () => {
    gsap.fromTo(
      "h1",
      { opacity: 0, y: 100 },
      { opacity: 1, y: 0, duration: 1, ease: "power2.inOut" }
    )
  },
  { scope: sectionRef }
)
```

**Key Rules**:
- Always use `useGSAP` hook
- Use refs for scoping to avoid class/attribute conflicts
- Scope allows simple selectors without affecting other elements

## Payload CMS Integration

### SmartSite Configuration System

The `smartsite.config.ts` uses a powerful override system for Payload collections, globals, and blocks:

**Boolean Override System**:
```typescript
// smartsite.config.ts
const smartSiteConfig = defineConfig({
  // Disable default collections with boolean flags
  collections: [
    { services: false, team: false }, // Disable services & team
    CustomProducts,                   // Add custom collection
  ],
  
  // Same pattern for globals and blocks
  globals: [{ footer: false }],       // Disable footer
  blocks: [{ form: false }],          // Disable form block
  
  // Other Payload config goes here
  payload: {
    cors: ['https://mydomain.com'],
  }
})
```

**Benefits**:
- **Type Safe**: `collections: (CollectionConfig | {services: false})[]`
- **Clean API**: Easy boolean flags for disabling defaults
- **Flexible**: Mix custom configs with boolean overrides
- **No Conflicts**: Separate from main Payload config typing

### Collections Structure

**Default Collections** (can be disabled with boolean flags):
- **Pages**: Main page content with flexible sections
- **Posts**: Blog/article content  
- **Services**: Service-specific pages
- **Team**: Team member profiles
- **Templates**: Reusable page templates
- **URI Index**: URL routing and management
- **Media**: File/image management
- **Categories**: Content categorization
- **Users**: Admin user management

### Field-to-Component Architecture

**Reusable Field Functions** (`src/admin/payload/fields/`) map 1:1 to React components:

- `sectionIntro()` → `<SectionIntro />` - Standard heading + description
- `sectionCta()` → `<SectionCta />` - Call-to-action with button
- `button()` → `<CMSLink />` - Single button with variants
- `link()` → `<CMSLink />` - Internal references or external URLs
- `content()` → `<RichText />` - Rich text content fields

### Layout Components (`src/components/layout/`)

Pre-built components that consume field data directly:

```typescript
<SectionIntro heading={heading} description={description} align="center" />
<SectionCta text={ctaText} button={ctaButton} />
```

### Data Fetching Patterns

```typescript
// Server components (preferred)
import { getPayload } from "payload"

const data = await getPayload().findByID({
  collection: "pages",
  id: params.id,
})

// Client components (when needed)  
import { useFetch } from "@/hooks/useFetch"

const { data } = useFetch(`/api/pages/${id}`)
```

## Development Guidelines

### Type Generation

If types are missing, run:
```bash
npm run generate:types
```

**NEVER create manual types** - always wait for Payload generation.

### Design System Integration

- **Check existing patterns** before creating new components
- **Use typography.css** for text styling
- **Follow Tailwind v4 syntax** for modern features
- **Leverage layout components** for consistent spacing/structure

## Testing & Quality

```bash
# Before committing any changes
pnpm lint          # ESLint validation
pnpm type-check    # TypeScript validation
pnpm format        # Prettier formatting
```

### Database Seeding

After schema changes:
```bash
pnpm seed          # Repopulate with sample data
```

## Common Patterns

### Rich Text Handling

```typescript
import RichText from "@/admin/payload/components/frontend/rich-text"

<div className="prose max-w-none">
  <RichText data={content} />
</div>
```

### Media Handling

```typescript
import { Media } from "@/admin/payload/components/frontend/media"

<Media resource={image} className="aspect-video object-cover" />
```

### Link Handling

```typescript
import { CMSLink } from "@/admin/payload/components/frontend/cms-link"

<CMSLink {...button} appearance={button?.variant || "default"} />
```

This architecture ensures consistent, maintainable code that scales across different website projects while maintaining design system integrity.