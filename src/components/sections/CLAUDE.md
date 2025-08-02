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

## Creating New Sections - Step-by-Step Process

When a user asks to "create a new section", follow this exact process in order:

### Step 1: Create Section Directory

```bash
# Always use kebab-case for folder names
mkdir src/components/sections/new-section-name/
```

### Step 2: Create Required Files

Every section needs exactly two files:

- `config.ts` - Payload CMS field configuration
- `Component.tsx` - React component implementation

### Step 3: ⚠️ PAUSE - Assess User Request

**If user provides NO design/screenshot/UI description**:

- Create empty config and empty component only
- Stop here until user provides design details

**If user provides design/screenshot**:

- Analyze the design first
- Decide what fields content editors need to control
- Continue to Step 4

### Step 4: Build Config File First

Start with the config to define what data the CMS will provide:

```typescript
// src/components/sections/new-section-name/config.ts
import type { Block } from "payload"
import { sectionIntro, sectionCta } from "@/admin/payload/fields"

export const NewSectionName: Block = {
  slug: "new-section-name", // Must match folder name, kebab-case, unique across site
  admin: {
    group: "Content Sections", // Groups related sections in CMS admin UI
  },
  interfaceName: "NewSectionNameBlock", // CRITICAL: Payload generates TypeScript types from this
  fields: [
    // Start empty if no design provided:
    // fields: []
  ],
}
```

**Understanding `interfaceName`**:

- Payload automatically generates TypeScript types from this name
- `interfaceName: "NewSectionNameBlock"` creates type `NewSectionNameBlock`
- This type includes all your field definitions as props
- Import this generated type in your component: `import type { NewSectionNameBlock } from "@/admin/payload/payload-types"`
- The component props will match exactly what you define in the `fields` array

### Step 5: Register Config File

Export and register in `src/components/sections/config.ts`:

```typescript
// Add export
export { NewSectionName } from "./new-section-name/config"

// Add to sectionBlocks array
export const sections = {
  sectionBlocks: [
    // ... existing sections
    NewSectionName, // Add here
  ],
}
```

### Step 6: Register Component Mapping

Add to `src/components/sections/sections-map.tsx`:

```typescript
import { NewSectionNameComponent } from "./new-section-name/Component"

export const sectionsMap: Record<string, React.ComponentType<any>> = {
  // ... existing mappings
  "new-section-name": NewSectionNameComponent, // Must match config slug
}
```

### Step 7: Build React Component

Create the component using props from config. The `interfaceName` from your config becomes your TypeScript type:

```typescript
// src/components/sections/new-section-name/Component.tsx
import { cn } from "@/utilities/ui"
import { SectionIntro } from "@/components/layout/section-intro"
import { SectionCta } from "@/components/layout/section-cta"
import { Media } from "@/components/fields/media"
import type { NewSectionNameBlock } from "@/admin/payload/payload-types"

export const NewSectionNameComponent: React.FC<NewSectionNameBlock> = props => {
  const {
    heading,      // These props come directly from your config fields
    description,  // sectionIntro() provides heading + description
    layout = "left-right", // Your custom select field
    backgroundImage,       // Your upload field
    text,         // sectionCta() provides text + button
    button
  } = props

  return (
    <section>
      <div className="container">
        <div className={cn(
          "grid gap-content-lg items-center",
          layout === "left-right" && "lg:grid-cols-2",
          layout === "right-left" && "lg:grid-cols-2",
          layout === "stacked" && "max-w-content-lg mx-auto text-center"
        )}>
          <div className={cn(
            "flex flex-col gap-content",
            layout === "right-left" && "lg:order-2"
          )}>
            <SectionIntro
              heading={heading}
              description={description}
              align={layout === "stacked" ? "center" : "start"}
            />
            <SectionCta text={text} button={button} />
          </div>

          {backgroundImage && (
            <div className={cn(
              "relative aspect-video",
              layout === "right-left" && "lg:order-1"
            )}>
              <Media
                resource={backgroundImage}
                fill
                className="object-cover rounded-content"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
```

### Empty Section Boilerplate

**If user provides NO design**, create minimal boilerplate:

```typescript
// config.ts - Empty version
import type { Block } from "payload"

export const NewSectionName: Block = {
  slug: "new-section-name",
  admin: {
    group: "Content Sections",
  },
  interfaceName: "NewSectionNameBlock",
  fields: [], // Empty - wait for user to provide design details
}
```

```typescript
// Component.tsx - Empty version
import type { NewSectionNameBlock } from "@/admin/payload/payload-types"

export const NewSectionNameComponent: React.FC<NewSectionNameBlock> = props => {
  return (
    <section>
      <div className="container">
        {/* Component implementation goes here once design is provided */}
      </div>
    </section>
  )
}
```

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
