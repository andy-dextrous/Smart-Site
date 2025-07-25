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
- `src/payload/` - CMS configuration separated from frontend
- `src/lib/cache/` - Performance caching utilities
- `src/lib/routing/` - URI routing engine and navigation
- `src/utilities/` - Shared utilities used by Payload and frontend

## Section Development Workflow

### The Section-First Approach

Every website consists of stacked `<section>` elements inside `<main>`. Payload CMS handles page templating by organizing these sections.

### Creating New Sections

**CRITICAL**: Follow this exact process in order:

1. **Create folder**: `src/components/sections/new-section-name/` (kebab-case)
2. **Create files**: `Component.tsx` and `config.ts`
3. **Build config first**: Design CMS fields based on client control needs
4. **Export to system**: Add to `src/components/sections/config.ts`
5. **Register component**: Add to `src/components/sections/RenderSections.tsx`
6. **Build component**: Use generated Payload types

### Section Naming Convention

Use **architectural/layout names**, NOT content-specific names:
- ✅ `hero-split`, `card-grid`, `text-image`
- ❌ `service-hero`, `product-grid`, `about-content`

### Config File Pattern

```typescript
import type { Block } from "payload"

export const SectionName: Block = {
  slug: "section-name", // kebab-case, unique across site
  admin: {
    group: "Content Sections", // Group related sections
  },
  interfaceName: "SectionNameBlock", // Payload generates types from this
  fields: [
    // Field definitions here
  ]
}
```

### Component File Pattern

```typescript
import { cn } from "@/utilities/ui"
import RichText from "@/payload/components/rich-text"
import type { SectionNameBlock } from "@/payload/payload-types"

/*************************************************************************/
/*  SECTION NAME COMPONENT
/*************************************************************************/

export const SectionNameComponent: React.FC<SectionNameBlock> = props => {
  const { heading, content } = props

  return (
    <section>
      <div className="container flex gap-8">
        <div className="flex flex-1 flex-col items-start gap-4">
          <h2>{heading}</h2>
          <div className="prose max-w-none">
            <RichText data={content} />
          </div>
        </div>
      </div>
    </section>
  )
}
```

## Field-to-Component Architecture

### Reusable Field Functions (src/payload/fields/)

The app uses **reusable field functions** that map 1:1 to React components:

- `sectionIntro()` → `<SectionIntro />` - Standard heading + description
- `sectionCta()` → `<SectionCta />` - Call-to-action with button
- `button()` → `<CMSLink />` - Single button with variants
- `buttonsGroup()` → Multiple `<CMSLink />` elements
- `link()` → `<CMSLink />` - Internal references or external URLs
- `content()` → `<RichText />` - Rich text content fields

### Using Field Functions

```typescript
// In section config
fields: [
  sectionIntro({
    collapsibleLabel: "Content",
    headingDescription: "Use <span> tags for gradient text",
  }),
  sectionCta({
    collapsibleLabel: "Call to Action",
    buttonDescription: "Primary action button",
  }),
]
```

### Layout Components (src/components/layout/)

Pre-built components that consume field data directly:

```typescript
// In section component
<SectionIntro heading={heading} description={description} align="center" />
<SectionCta text={ctaText} button={ctaButton} />
```

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

1. **Config**: Set `gsap: true` in `src/wc.config.ts`
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

### Collections Structure

- **Pages**: Main page content with flexible sections
- **Posts**: Blog/article content
- **Services**: Service-specific pages
- **Team**: Team member profiles
- **Templates**: Reusable page templates
- **URI Index**: URL routing and management

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

### Route Groups Separation

- **Frontend Logic**: Keep in `(frontend)` routes
- **Admin Logic**: Keep in `(payload)` routes
- **Never mix**: Admin components shouldn't be used in frontend

## Development Guidelines

### Section Development Rules

1. **Confirm fields** with user before creating them
2. **Infer from screenshots** when provided - map to design system
3. **NO documentation files** - code should be self-documenting
4. **NO manual types** - Payload generates automatically
5. **Generic naming** - architectural, not content-specific
6. **Check collections** in `src/payload/collections/config.ts` for relationships

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
pnpm check-types   # TypeScript validation
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
import RichText from "@/payload/components/rich-text"

<div className="prose max-w-none">
  <RichText data={content} />
</div>
```

### Media Handling

```typescript
import { Media } from "@/payload/components/frontend/media"

<Media resource={image} className="aspect-video object-cover" />
```

### Link Handling

```typescript
import { CMSLink } from "@/payload/components/frontend/cms-link"

<CMSLink {...button} appearance={button?.variant || "default"} />
```

This architecture ensures consistent, maintainable code that scales across different website projects while maintaining design system integrity.