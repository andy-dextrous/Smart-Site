---
description: Create a new section for Smart-Site with proper structure, config, and registration
allowed_tools:
  - Write
  - MultiEdit
  - Read
  - LS
---

# Create New Section: $ARGUMENTS

Create a new section for Smart-Site following the established section-first, field-driven architecture.

## Section Development Philosophy

Sections are the **primary development area** for smart-site (90% of development time). They are **architectural layouts**, not content-specific implementations. Name them for their structure, not their content.

### Understanding Section Architecture

Every smart-site has a `<header />`, `<main />` and `<footer />` inside the `<body />`. Inside the `<main>` you have stacked `<section>` elements that comprise the website content.

**Core Principles**:
- Sections are full-width architectural layouts
- Always render as `<section>` elements  
- Named for structure (`hero-split`, `card-grid`) not content (`about-hero`, `services-section`)
- Heavily leverage reusable field functions for consistency
- Receive automatic page context props from the rendering system

### Section Naming Guidelines

✅ **GOOD**: `hero-split`, `card-grid`, `text-image`, `stats-row`, `testimonial-slider`, `cta-centered`, `feature-list`
❌ **BAD**: `services-hero`, `about-section`, `pricing-cards`, `contact-form` (content-specific, not reusable)

## Parse User Request

Extract from "$ARGUMENTS":
- Section name (must be kebab-case, architecture-based)
- Whether design/screenshot/UI details were provided
- Specific field requirements mentioned
- Component structure/layout needs

If the name is content-specific, suggest an architectural name instead.

## Step 1: Create Section Directory

```bash
mkdir apps/smart-site/src/components/sections/{section-name}/
```

Always use kebab-case for the folder name.

## Step 2: Create Config File

### Field-First Development Approach

Sections should heavily leverage field functions from `@/admin/payload/fields`. This creates the consistent, predictable data structures that make smart-site powerful.

**The 1:1 Mapping Principle**:
- `sectionIntro()` field → `<SectionIntro />` component
- `sectionCta()` field → `<SectionCta />` component  
- `button()` field → `<CMSLink />` component
- `link()` field → `<CMSLink />` component
- `content()` field → `<RichText />` component
- `linkGroup()` field → Array of links
- `imageUpload()` field → `<Media />` component

### Available Field Functions

Common reusable fields to leverage:
- `sectionIntro({ headingRequired?, collapsibleLabel?, headingDescription? })` - Heading + description
- `sectionCta({ collapsibleLabel? })` - Text + button call-to-action
- `button()` - Single button with variants
- `link()` - Internal/external URL
- `content({ collapsibleLabel?, description? })` - Rich text content
- `linkGroup({ collapsibleLabel? })` - Multiple links
- `imageUpload({ collapsibleLabel? })` - Image/media upload

### Config File Structure

Create `apps/smart-site/src/components/sections/{section-name}/config.ts`:

```typescript
import type { Block } from "payload"
import { sectionIntro, sectionCta, content, linkGroup, imageUpload } from "@/admin/payload/fields"

export const {InterfaceName}: Block = {
  slug: "{section-name}", // Must match folder name, kebab-case, unique across site
  admin: {
    group: "Content Sections", // Groups related sections in CMS admin UI
  },
  interfaceName: "{InterfaceName}Block", // CRITICAL: Payload generates TypeScript types from this
  fields: [
    // If design provided, analyze and add appropriate fields
    // If no design, leave empty with comment: // fields: []
  ],
}
```

**Understanding `interfaceName`**:
- Payload automatically generates TypeScript types from this name
- `interfaceName: "HeroSplit"` creates type `HeroSplitBlock`
- This type includes all your field definitions as props
- Import this generated type in your component
- The component props will match exactly what you define in the `fields` array

### Field Configuration Examples

**Basic section with intro and CTA**:
```typescript
fields: [
  sectionIntro({
    headingRequired: true,
    collapsibleLabel: "Hero Content",
    headingDescription: "Use <span> tags for gradient text highlighting",
  }),
  sectionCta({
    collapsibleLabel: "Call to Action",
  }),
]
```

**Section with layout options**:
```typescript
fields: [
  sectionIntro(),
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
  },
  imageUpload({
    collapsibleLabel: "Background Image",
  }),
  sectionCta(),
]
```

**Section with content relationships**:
```typescript
fields: [
  sectionIntro(),
  {
    name: "featuredPosts",
    type: "relationship",
    relationTo: "posts",
    hasMany: true,
    maxRows: 3,
    admin: {
      description: "Select up to 3 posts to feature",
    },
  },
]
```

## Step 3: Register Config

Export and add to `apps/smart-site/src/components/sections/config.ts`:

```typescript
// Add export at top of file
export { {InterfaceName} } from "./{section-name}/config"

// Add to sectionBlocks array
export const sections = {
  sectionBlocks: [
    // ... existing sections
    {InterfaceName}, // Add here - MUST use the exported name, not the slug
  ],
}
```

## Step 4: Create Component File

### Component Props Architecture

Every section component receives **two types of props**:

#### 1. CMS Field Props (from your config)
These come directly from your `fields` array in the section config

#### 2. Page Context Props (automatically injected)
The `RenderSections` component automatically injects:
```typescript
export interface PageData {
  document?: any // Complete page/post document data
  collection?: string // Source collection ("pages", "posts", etc.)
  breadcrumbs?: any[] // Hierarchical breadcrumb array
}
```

### Component File Structure

Create `apps/smart-site/src/components/sections/{section-name}/Component.tsx`:

**If design was provided**:
```typescript
import { cn } from "@/utilities/ui"
import { SectionIntro } from "@/components/layout/section-intro"
import { SectionCta } from "@/components/layout/section-cta"
import { Media } from "@/components/fields/media"
import { CMSLink } from "@/components/fields/link"
import RichText from "@/components/fields/rich-text"
import type { {InterfaceName}Block } from "@/admin/payload/payload-types"
import type { PageData } from "@/admin/components/render-sections"

export const {InterfaceName}Component: React.FC<{InterfaceName}Block & PageData> = props => {
  const {
    // Your CMS fields (from config)
    heading,
    description,
    layout = "left-right",
    backgroundImage,
    text,
    button,
    
    // Injected page context (optional to use)
    document,
    collection,
    breadcrumbs
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

**If NO design provided (empty boilerplate)**:
```typescript
import type { {InterfaceName}Block } from "@/admin/payload/payload-types"

export const {InterfaceName}Component: React.FC<{InterfaceName}Block> = props => {
  return (
    <section>
      <div className="container">
        {/* Component implementation goes here once design is provided */}
      </div>
    </section>
  )
}
```

### Component Implementation Guidelines

**Layout Patterns - Use Flex with Gaps**:
```typescript
// ✅ CORRECT - Flex with gap
<div className="flex flex-col gap-content">
  <h2>Title</h2>
  <p>Description</p>
  <button>Action</button>
</div>

// ❌ WRONG - Individual margins  
<div>
  <h2 className="mb-4">Title</h2>
  <p className="mb-6">Description</p>
</div>
```

**Spacing Variables**:
- `gap-content` - Default spacing
- `gap-content-sm` - Tight spacing
- `gap-content-lg` - Loose spacing

**NEVER hardcode content**:
- All text should come from CMS fields
- All images should use Media component
- All links should use CMSLink component

## Step 5: Register Component Mapping

Add to `apps/smart-site/src/components/sections/sections-map.tsx`:

```typescript
// Import the component
import { {InterfaceName}Component } from "./{section-name}/Component"

// Add to sectionsMap object
export const sectionsMap: Record<string, React.ComponentType<any>> = {
  // ... existing mappings
  "{section-name}": {InterfaceName}Component, // Key MUST match config slug exactly
}
```

## Step 6: Verify Registration

Check that:
1. Config is exported in `sections/config.ts` and added to `sectionBlocks` array
2. Component is mapped in `sections-map.tsx` with slug as key
3. Folder name, slug, and sections-map key all match (kebab-case)
4. InterfaceName is PascalCase and matches in all locations

## Quality Checklist

- [ ] Folder uses kebab-case and architectural naming
- [ ] Config slug matches folder name exactly
- [ ] Config exported and added to sectionBlocks array
- [ ] Component registered in sections-map.tsx with correct slug
- [ ] Uses reusable field functions where possible
- [ ] No hardcoded content - everything from CMS
- [ ] Provides helpful admin descriptions for custom fields
- [ ] Includes realistic default values for select/radio fields
- [ ] Component uses proper TypeScript types from Payload
- [ ] Uses flex/gap for spacing, not margins
- [ ] All CMS content rendered with proper components (Media, CMSLink, RichText)

## Troubleshooting

**Section not appearing in CMS**:
- Check config is exported and added to sectionBlocks array
- Run `pnpm dev` restart if needed

**Section not rendering on frontend**:
- Verify sections-map.tsx has correct slug mapping
- Check browser console for component errors

**Types not found**:
- Types are auto-generated when Payload starts
- Never create manual types for CMS data

**Fields not saving**:
- Verify field configuration syntax
- Check browser console for Payload errors

## Summary Output

After creating the section, provide:
1. Files created and their locations
2. Registration points updated
3. If design wasn't provided: "Please provide a design or description of the section layout so I can implement the component"
4. If implementation complete: "Section '{section-name}' created and registered successfully"

Remember: This is the primary development pattern for smart-site. 90% of development is creating these sections from designs.