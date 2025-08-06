# CLAUDE.md - Section Creation

This file provides section-specific guidance that builds on [components CLAUDE.md](../CLAUDE.md). Read the components guide first for GSAP, Tailwind v4, and CMS integration patterns.

Every smart-site has a <header />, <main /> and <footer /> that live inside the <body />. It is set up so that the user can spend 90% of their time just building sections from designs. Inside the <main> you will have stacked <section> elements that comprise the content of the website.

## How Sections Are Injected Into the Frontend

### URI Routing Flow

1. **Generic URI Handler** (`app/(frontend)/[[...uri]]/page.tsx`):
   - Catches all frontend routes using Next.js catch-all routing
   - Passes URI segments to `SmartSiteURIRenderer`

2. **URI Resolution** (`SmartSiteURIRenderer`):
   - Uses `routingEngine.slugToURI()` to normalize the URI
   - Resolves document via `cache.getByURI()` with O(1) lookup
   - Fetches document data, collection info, and breadcrumbs from URI Index

3. **Section Rendering** (`RenderSections` component):
   - Receives `document.sections` array from CMS
   - Maps each section's `blockType` to React component via `sectionsMap`
   - Dynamically renders section components with enhanced props

### Section Props Architecture

Every section component receives **two types of props**:

#### 1. **CMS Field Props** (from your config)

These come directly from your `fields` array in the section config:

```typescript
// Your config fields become component props
fields: [
  sectionIntro(), // → heading, description props
  {
    name: "layout",
    type: "select", // → layout prop
  },
]

// Component receives these props
export const MyComponent: React.FC<MyBlockType> = props => {
  const { heading, description, text, button, layout } = props
}
```

#### 2. **Page Context Props** (automatically injected)

The `RenderSections` component automatically injects additional context props to **every section**:

```typescript
export interface PageData {
  document?: any // Complete page/post document data
  collection?: string // Source collection ("pages", "posts", etc.)
  breadcrumbs?: any[] // Hierarchical breadcrumb array
}
```

### Accessing Page Context in Sections

To use the injected page context, extend your component type with `PageData`:

```typescript
import type { MyBlockType } from "@/admin/payload/payload-types"
import type { PageData } from "@/admin/components/render-sections"

export const MyComponent: React.FC<MyBlockType & PageData> = props => {
  const {
    // Your CMS fields
    heading,
    description,

    // Injected page context
    document,     // Full page/post data
    collection,   // "pages", "posts", etc.
    breadcrumbs   // Breadcrumb navigation data
  } = props

  // Example: Access current page title
  const pageTitle = document?.title

  // Example: Check if this is a blog post
  const isPost = collection === "posts"

  // Example: Use breadcrumbs for navigation
  const showBreadcrumbs = breadcrumbs && breadcrumbs.length > 1

  return (
    <section>
      {showBreadcrumbs && (
        <nav>
          {breadcrumbs.map(crumb => (
            <a key={crumb.uri} href={crumb.uri}>{crumb.label}</a>
          ))}
        </nav>
      )}

      <h1>{heading || pageTitle}</h1>
      {isPost && <p>This is a blog post section</p>}
    </section>
  )
}
```

### Section Registration and Rendering

The system uses a **two-step registration** that connects your section configs to React components:

1. **Config Registration** (`src/components/sections/config.ts`):

   ```typescript
   export const sections = {
     sectionBlocks: [NewSectionName], // CMS sees this
   }
   ```

2. **Component Mapping** (`src/components/sections/sections-map.tsx`):

   ```typescript
   export const sectionsMap = {
     "new-section-name": NewSectionNameComponent, // Frontend renders this
   }
   ```

3. **Dynamic Rendering** (happens automatically):
   ```typescript
   // RenderSections maps blockType to component
   const Section = sectionsMap[section.blockType]
   return <Section {...section} document={document} collection={collection} breadcrumbs={breadcrumbs} />
   ```

## Section Development Philosophy

This directory is the **primary development area** for the smart-site frontend application (along with headers, footers and used components).

Every section follows a strict **two-file pattern** that creates predictable, maintainable components with CMS integration.

**Core Principle**: Sections are **architectural layouts**, not content-specific implementations. Name them for their structure, not their content.

## When to Use Fields, Blocks, or Sections

### Use Fields When:
- **You need consistent data structures** - Same heading format everywhere
- **Building reusable patterns** - Buttons, links, CTAs that appear in multiple places
- **Enforcing data consistency** - Ensure all team member cards have the same fields
- **Creating composite patterns** - Group related fields together (e.g., sectionIntro = heading + description)

**Field Best Practices**:
```typescript
// ✅ ALWAYS prefer field functions over manual field definitions
fields: [
  sectionIntro(),      // Consistent heading + description
  sectionCta(),        // Reusable CTA pattern
  button(),            // Standard button configuration
]

// ❌ AVOID recreating common patterns manually
fields: [
  { name: "heading", type: "text" },        // Use sectionIntro() instead
  { name: "description", type: "textarea" }, // This is what fields prevent
]
```

### Use Blocks When:
- **Content needs to be embedded in rich text** - Forms within blog posts
- **Building dynamic article content** - Code snippets, media embeds, quotes
- **Creating reusable content widgets** - That aren't full-width sections
- **Enhancing long-form content** - Adding structure within posts/pages

**Block Examples**:
- Form embedded in a blog post about contact methods
- Image gallery within an article about architecture
- Code snippet in a technical tutorial
- Related posts widget at the end of an article

### Use Sections When:
- **Building page layouts** - The primary way to construct pages
- **Need full-width architectural elements** - Heroes, feature grids, testimonials
- **Creating visual page structure** - Sections stack to form complete pages
- **Implementing design system patterns** - Pre-designed layouts from mockups

**Section Principles**:
- Sections are 90% of your development work
- Always leverage field functions for consistency
- Name for structure, not content
- Think architecturally - how does this layout work?

## Field-First Development

**CRITICAL**: Sections should heavily leverage field functions. This creates the consistent, predictable data structures that make smart-site powerful.

```typescript
// ✅ CORRECT - Field-first approach
export const NewSection: Block = {
  fields: [
    sectionIntro({               // Reusable field function
      headingRequired: true,
      collapsibleLabel: "Hero Content"
    }),
    {
      name: "layout",            // Custom field for this section
      type: "select",
      options: ["left", "right", "center"]
    },
    sectionCta(),                // Another reusable field
    linkGroup({                  // Reusable link patterns
      collapsibleLabel: "Navigation Links"
    })
  ]
}

// ❌ WRONG - Recreating field patterns
export const NewSection: Block = {
  fields: [
    {
      name: "heading",           // Don't recreate sectionIntro!
      type: "text"
    },
    {
      name: "description",       // This is what fields prevent
      type: "textarea"
    }
  ]
}
```

**The 1:1 Mapping Principle**:
- `sectionIntro()` field → `<SectionIntro />` component
- `sectionCta()` field → `<SectionCta />` component
- `button()` field → `<CMSLink />` component
- `content()` field → `<RichText />` component

This consistent mapping means:
1. Editors know what to expect in the CMS
2. Developers know what props components receive
3. Designs are implemented consistently
4. Changes propagate everywhere automatically

## Creating New Sections

**To create a new section**: Use the `/new-section [section-name]` command.

This command handles the complete section creation process including:
- Directory creation with proper structure
- Config file with field definitions
- Component file with TypeScript types
- Registration in both config.ts and sections-map.tsx
- Quality checks and troubleshooting

## Section Configuration and Development

### Field Configuration Strategy

**Analyze the design and decide editor control level**:

**Basic Control**: Heading, description, buttons (use reusable field functions)
**Advanced Control**: Layout options, optional elements, color schemes, content relationships

**Always prefer reusable field functions** from `@/admin/payload/fields`:

```typescript
import { sectionIntro, sectionCta, button, link, content } from "@/admin/payload/fields"

fields: [
  sectionIntro({
    collapsibleLabel: "Hero Content",
    headingDescription: "Use <span> tags for gradient text highlighting",
  }),
  content({
    collapsibleLabel: "Main Content",
    description: "Rich text content with formatting options",
  }),
  sectionCta({
    collapsibleLabel: "Call to Action",
  }),
]
```

### Custom Field Examples

For sections requiring specific editor control:

```typescript
{
  name: "layout",
  type: "select",
  defaultValue: "left-right",
  options: [
    { label: "Left Content, Right Image", value: "left-right" },
    { label: "Right Content, Left Image", value: "right-left" },
    { label: "Stacked", value: "stacked" },
  ],
  admin: {
    description: "Choose how content and image are arranged",
  },
}
```

## Naming and Best Practices

### Section Names (Architecture-Based)

✅ **Good**: `hero-split`, `card-grid`, `text-image`, `stats-row`, `testimonial-slider`, `cta-centered`, `feature-list`
❌ **Bad**: `services-hero`, `about-section`, `pricing-cards`, `contact-form` (content-specific, not reusable)

### Field Names

✅ **Good**: `heading`, `description`, `primaryButton`, `backgroundImage`, `layout`
❌ **Bad**: `title`, `text`, `button`, `image` (too generic/unclear)

### Development Rules

1. **Confirm fields** with user before creating them
2. **Start with config file** to define CMS structure
3. **Register in both places** - config.ts and sections-map.tsx
4. **Use architectural naming** (layout-based, not content-based)
5. **Leverage reusable field functions** (sectionIntro, sectionCta)
6. **Check existing collections** in `src/admin/payload/collections/frontend/`
7. **NO manual types** - Payload generates automatically
8. **NO documentation files** - code should be self-documenting

### Quality Checklist

- [ ] Config exported in `config.ts` and added to `sectionBlocks` array
- [ ] Component registered in `sections-map.tsx`
- [ ] Uses architectural naming (not content-specific)
- [ ] Leverages reusable field functions where possible
- [ ] Provides helpful admin descriptions
- [ ] Includes realistic default values
- [ ] Uses proper TypeScript types from Payload
- [ ] No hardcoded content or styles

## Registration System

Sections use a centralized registration system:

**1. Config Registration** (`src/components/sections/config.ts`):

- Export section config and add to `sectionBlocks` array
- Single source of truth for all available sections

**2. Component Mapping** (`src/components/sections/sections-map.tsx`):

- Map block slug to React component
- Must match the slug names from configs

```typescript
// config.ts - Export and register
export { NewSectionName } from "./new-section-name/config"
export const sections = {
  sectionBlocks: [HeroPrimary, TextImage, NewSectionName],
}

// sections-map.tsx - Map component to slug
import { NewSectionNameComponent } from "./new-section-name/Component"
export const sectionsMap: Record<string, React.ComponentType<any>> = {
  "new-section-name": NewSectionNameComponent, // Must match config slug
}
```

## Field-to-Component Architecture

**1:1 mapping principle** between CMS fields and React components:

- **`sectionIntro()`** → **`<SectionIntro />`** - Heading + description
- **`sectionCta()`** → **`<SectionCta />`** - Call-to-action with button
- **`button()`** → **`<CMSLink />`** - Single button variants
- **`link()`** → **`<CMSLink />`** - Internal/external URLs
- **`content()`** → **`<RichText />`** - Rich text content

This ensures 90% of development time is spent on layout and design rather than CMS integration.

## Troubleshooting

**Types not found**: Run `pnpm generate:types` (never create manual types)
**Section not appearing**: Check both registration files
**CMS fields not saving**: Verify field configuration syntax
