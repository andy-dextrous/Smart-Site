# CLAUDE.md - Section Creation

This file provides guidance for Claude Code when working specifically within the `apps/smart-site/src/components/sections/` directory.

## Section Development Philosophy

This directory is the **primary development area** for the smart-site application. Every section follows a strict **two-file pattern** that creates predictable, maintainable components with CMS integration.

**Core Principle**: Sections are **architectural layouts**, not content-specific implementations. Name them for their structure, not their content.

**Styling Rule**: All sections must follow the design system rules established in [components CLAUDE.md](../CLAUDE.md) - use design tokens, not generic Tailwind classes.

## Mandatory Section Creation Process

**CRITICAL**: Follow this exact sequence when creating any new section:

### Step 1: Create Directory Structure

```bash
# Always use kebab-case
mkdir src/components/sections/new-section-name/
```

### Step 2: Create Required Files

Every section MUST have exactly two files:

- `Component.tsx` - React component implementation
- `config.ts` - Payload CMS field configuration

### Step 3: Build Config First

**ALWAYS start with the config file**. This determines:

- What data the CMS will provide
- What control the content editor will have
- How flexible the component needs to be

```typescript
// config.ts template
import type { Block } from "payload"
import { sectionIntro, sectionCta } from "@/admin/payload/fields"

export const NewSectionName: Block = {
  slug: "new-section-name", // MUST match folder name
  admin: {
    group: "Content Sections", // Group related sections
  },
  interfaceName: "NewSectionNameBlock", // Payload generates types from this
  fields: [
    // Field definitions - start empty if no design provided
  ],
}
```

### Step 4: Register in System

**Both files must be registered** for the section to work:

#### A. Export config in `src/components/sections/config.ts`:

```typescript
export { NewSectionName } from "./new-section-name/config"

// Add to sectionBlocks array
export const sections = {
  sectionBlocks: [
    // ... existing sections
    NewSectionName,
  ],
}
```

#### B. Register component in `src/components/sections/sections-map.tsx`:

```typescript
import { NewSectionNameComponent } from "./new-section-name/Component"

export const sectionsMap: Record<string, React.ComponentType<any>> = {
  // ... existing sections
  "new-section-name": NewSectionNameComponent,
}
```

### Step 5: Build Component

Only after config registration, build the component:

```typescript
// Component.tsx template
import { cn } from "@/utilities/ui"
import type { NewSectionNameBlock } from "@/admin/payload/payload-types"

/*************************************************************************/
/*  NEW SECTION NAME COMPONENT
/*************************************************************************/

export const NewSectionNameComponent: React.FC<NewSectionNameBlock> = props => {
  const { /* destructure props from config fields */ } = props

  return (
    <section>
      <div className="container">
        {/* Component implementation */}
      </div>
    </section>
  )
}
```

## Field Configuration Patterns

### Using Reusable Field Functions

**ALWAYS prefer reusable field functions IF they exist** from `@/admin/payload/fields`:

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

### Advanced Field Customization

For sections requiring specific editor control:

```typescript
fields: [
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
  {
    name: "colorScheme",
    type: "select",
    defaultValue: "light",
    options: [
      { label: "Light", value: "light" },
      { label: "Dark", value: "dark" },
      { label: "Gradient", value: "gradient" },
    ],
  },
]
```

## Component Implementation Patterns

### Basic Component Structure

```typescript
import { cn } from "@/utilities/ui"
import { SectionIntro } from "@/components/layout/section-intro"
import { SectionCta } from "@/components/layout/section-cta"
import { Media } from "@/admin/payload/components/frontend/media"
import type { HeroSplitBlock } from "@/admin/payload/payload-types"

/*************************************************************************/
/*  HERO SPLIT COMPONENT
/*************************************************************************/

export const HeroSplitComponent: React.FC<HeroSplitBlock> = props => {
  const {
    heading,
    description,
    backgroundImage,
    layout = "left-right",
    colorScheme = "light"
  } = props

  return (
    <section className={cn(
      colorScheme === "dark" && "bg-surface-dark text-white",
      colorScheme === "gradient" && "bg-gradient-primary text-white"
    )}>
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
          </div>

          {backgroundImage && (
            <div className={cn(
              "relative aspect-video lg:aspect-square",
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

### Advanced Component with GSAP Animation

```typescript
"use client"

import { useGSAP, gsap } from "@/providers/gsap"
import { useRef } from "react"

export const AnimatedHeroComponent: React.FC<AnimatedHeroBlock> = props => {
  const sectionRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      gsap.fromTo(
        ".hero-content > *",
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: "power2.out"
        }
      )
    },
    { scope: sectionRef }
  )

  return (
    <section ref={sectionRef}>
      <div className="container">
        <div className="hero-content">
          {/* Animated content */}
        </div>
      </div>
    </section>
  )
}
```

## Naming Conventions

### Section Names (Architecture-Based)

✅ **Good Examples**:

- `hero-split` - Hero with side-by-side content/image
- `card-grid` - Grid of card components
- `text-image` - Text with accompanying image
- `stats-row` - Horizontal row of statistics
- `testimonial-slider` - Carousel of testimonials
- `cta-centered` - Centered call-to-action
- `feature-list` - Vertical list of features

❌ **Bad Examples**:

- `services-hero` - Content-specific, not reusable
- `about-section` - Page-specific naming
- `pricing-cards` - Business logic in name
- `contact-form` - Too specific to use case

### Field Names (Descriptive)

```typescript
// ✅ Good field names
fields: [
  { name: "heading", type: "text" },
  { name: "description", type: "richText" },
  { name: "primaryButton", type: "group" },
  { name: "backgroundImage", type: "upload" },
  { name: "layout", type: "select" },
]

// ❌ Avoid generic names
fields: [
  { name: "title", type: "text" }, // Too generic
  { name: "text", type: "richText" }, // Unclear purpose
  { name: "button", type: "group" }, // Which button?
  { name: "image", type: "upload" }, // What kind of image?
]
```

## Content Editor Considerations

### Field Descriptions

Always provide helpful admin descriptions:

```typescript
{
  name: "layout",
  type: "select",
  admin: {
    description: "Choose how content and image are arranged on desktop screens",
  },
}
```

### Default Values

Use realistic defaults for better editor experience:

```typescript
{
  name: "heading",
  type: "text",
  defaultValue: "Transform Your Business Today",
  admin: {
    description: "Main heading - use <span> tags to highlight text with gradient colors",
  },
}
```

### Collapsible Groups

Organize complex sections with collapsible groups:

```typescript
fields: [
  sectionIntro({
    collapsibleLabel: "Main Content",
  }),
  {
    name: "settings",
    type: "group",
    admin: {
      collapsible: true,
      initCollapsed: true,
    },
    fields: [
      // Advanced settings
    ],
  },
]
```

## Section Development Rules

1. **Confirm fields** with user before creating them
2. **Infer from screenshots** when provided - map to design system
3. **NO documentation files** - code should be self-documenting
4. **NO manual types** - Payload generates automatically
5. **Generic naming** - architectural, not content-specific
6. **Check collections** in `src/admin/payload/collections/` for relationships

## Common Anti-Patterns

### ❌ Avoid These Mistakes

1. **Creating types manually**:

```typescript
// DON'T DO THIS - Payload generates types automatically
interface HeroProps {
  title: string
  content: string
}
```

2. **Hardcoding content**:

```typescript
// DON'T DO THIS - Make it configurable via CMS
<h2>Our Services</h2>
```

3. **Skipping registration**:

```typescript
// DON'T FORGET to add to both:
// - src/components/sections/config.ts (sectionBlocks array)
// - src/components/sections/sections-map.tsx (sectionsMap object)
```

4. **Content-specific naming**:

```typescript
// DON'T DO THIS - Use architectural names instead
export const ServicesHero: Block = {
  slug: "services-hero",
}
```

## Debugging and Testing

### Type Issues

If Payload types are missing:

```bash
npm run generate:types
```

**NEVER create manual types** - always wait for Payload generation.

### Section Not Appearing

Check that section is registered in BOTH places:

1. `config.ts` exports and `sectionBlocks` array
2. `sections-map.tsx` component mapping

### CMS Fields Not Saving

Verify field configuration matches expected Payload field types and naming conventions.

## Quality Checklist

Before considering a section complete:

- [ ] Config exported in `config.ts` and added to `sectionBlocks` array
- [ ] Component registered in `sections-map.tsx`
- [ ] Uses architectural naming (not content-specific)
- [ ] Leverages reusable field functions where possible
- [ ] Provides helpful admin descriptions
- [ ] Includes realistic default values
- [ ] Uses design system tokens instead of generic Tailwind classes
- [ ] Handles responsive behavior appropriately
- [ ] Uses proper TypeScript types from Payload
- [ ] No hardcoded content or styles

This process ensures every section is maintainable, reusable, and integrates seamlessly with the CMS and design system.

## Unified Configuration System

The sections system uses a centralized registration approach that replaces the old pattern of importing into separate files:

### 1. Config Registration

**File**: `src/components/sections/config.ts`

- Exports `sectionBlocks` array containing all section configurations
- Single source of truth for all available sections
- Automatically consumed by Payload CMS

### 2. Component Mapping

**File**: `src/components/sections/sections-map.tsx`

- Maps block types to React components
- Used for dynamic component rendering
- Must match the slug names from configs

### 3. Server-Side Rendering

**File**: `src/admin/components/render-sections.tsx`

- Handles server-side section rendering
- Consumes the sections-map for component resolution
- Provides type-safe rendering of CMS content

### Registration Example

```typescript
// config.ts - Export and register your section
export { NewSectionName } from "./new-section-name/config"

export const sections = {
  sectionBlocks: [
    HeroPrimary,
    TextImage,
    NewSectionName, // Add new section here
  ],
}

// sections-map.tsx - Map component to slug
import { NewSectionNameComponent } from "./new-section-name/Component"

export const sectionsMap: Record<string, React.ComponentType<any>> = {
  "hero-primary": HeroPrimaryComponent,
  "text-image": TextImageComponent,
  "new-section-name": NewSectionNameComponent, // Must match config slug
}
```

This unified system ensures consistent registration and eliminates the need to import sections into multiple configuration files.

## Field-to-Component Architecture

The smart-site follows a **1:1 mapping principle** between CMS fields and React components:

### Reusable Field Functions

Located in `@/admin/payload/fields`, these functions create standardized field configurations:

- **`sectionIntro()`** → **`<SectionIntro />`** - Standard heading + description pattern
- **`sectionCta()`** → **`<SectionCta />`** - Call-to-action with button
- **`button()`** → **`<CMSLink />`** - Single button with variants
- **`link()`** → **`<CMSLink />`** - Internal references or external URLs
- **`content()`** → **`<RichText />`** - Rich text content fields

### Layout Components

Pre-built components in `@/components/layout/` consume field data directly:

```typescript
// Field configuration
sectionIntro({
  collapsibleLabel: "Hero Content",
  headingDescription: "Use <span> tags for gradient text highlighting",
})

// Component usage
<SectionIntro
  heading={heading}
  description={description}
  align="center"
/>
```

### Benefits

- **Predictable**: Every field maps to a specific component
- **Reusable**: Same patterns across all sections
- **Maintainable**: Changes in one place affect all sections
- **Type-Safe**: Payload generates types that match exactly

This architecture ensures that 90% of section development time is spent on layout and design rather than CMS integration patterns.

## Section-Specific CSS and HTML Rules

### 1. Section Padding Rule

**CRITICAL**: Sections have default padding declared in `base.css`:

```css
/* base.css - DO NOT OVERRIDE */
section {
  @apply px-section-x py-section-y;
}
```

```typescript
// ❌ WRONG - Never add padding to sections
<section className="py-20 px-6">

// ✅ CORRECT - Let base.css handle it
<section>

// ✅ CORRECT - Only add padding when explicitly asked
<section className="py-section-lg"> {/* When user specifically requests larger padding */}
```

### 2. Container Width/Padding Rule

**NEVER add width/padding to containers** - they inherit from base.css:

```typescript
// ❌ WRONG - Adding width/padding to containers
<section className="py-20">
  <div className="container px-6 max-w-7xl">

// ✅ CORRECT - Let base.css handle it
<section>
  <div className="container">

// ✅ CORRECT - Only modify when explicitly asked
<section className="py-section-lg"> {/* Only when user requests */}
```

## GSAP Integration Examples for Sections

### Section Component with GSAP Animation

```typescript
"use client"

import { useGSAP, gsap } from "@/providers/gsap"
import { useRef } from "react"
import { SectionIntro } from "@/components/layout/section-intro"
import type { HeroAnimatedBlock } from "@/admin/payload/payload-types"

export const HeroAnimatedComponent: React.FC<HeroAnimatedBlock> = (props) => {
  const { heading, description, backgroundImage } = props
  const sectionRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const tl = gsap.timeline()

      tl.fromTo(
        ".hero-content > *",
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: "power2.out"
        }
      )

      if (backgroundImage) {
        tl.fromTo(
          ".hero-image",
          { opacity: 0, scale: 1.1 },
          {
            opacity: 1,
            scale: 1,
            duration: 1.2,
            ease: "power2.out"
          },
          "-=0.5"
        )
      }
    },
    { scope: sectionRef }
  )

  return (
    <section ref={sectionRef}>
      <div className="container">
        <div className="hero-content max-w-content-lg mx-auto text-center">
          <SectionIntro
            heading={heading}
            description={description}
            align="center"
          />
        </div>

        {backgroundImage && (
          <div className="hero-image relative aspect-video" style={{ marginTop: 'var(--spacing-content-lg)' }}>
            {/* Media component */}
          </div>
        )}
      </div>
    </section>
  )
}
```

### Animation Debugging Pattern

```typescript
useGSAP(
  () => {
    const elements = gsap.utils.toArray(".animated-element")
    console.log("Found elements:", elements.length)

    gsap.from(elements, { opacity: 0, y: 50 })
  },
  { scope: sectionRef }
)
```

These GSAP integration patterns ensure smooth, performant animations that integrate seamlessly with the section-based architecture.
