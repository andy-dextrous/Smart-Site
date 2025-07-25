# CLAUDE.md - Section Creation

This file provides guidance for Claude Code when working specifically within the `apps/smart-site/src/components/sections/` directory.

## Section Development Philosophy

This directory is the **primary development area** for the smart-site application. Every section follows a strict **two-file pattern** that creates predictable, maintainable components with CMS integration.

**Core Principle**: Sections are **architectural layouts**, not content-specific implementations. Name them for their structure, not their content.

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
import { sectionIntro, sectionCta } from "@/payload/fields"

export const NewSectionName: Block = {
  slug: "new-section-name", // MUST match folder name
  admin: {
    group: "Content Sections", // Group related sections
  },
  interfaceName: "NewSectionNameBlock", // Payload generates types from this
  fields: [
    // Field definitions - start empty if no design provided
  ]
}
```

### Step 4: Register in System
**Both files must be registered** for the section to work:

#### A. Export config in `src/components/sections/config.ts`:
```typescript
export { NewSectionName } from "./new-section-name/config"
```

#### B. Register component in `src/components/sections/RenderSections.tsx`:
```typescript
import { NewSectionNameComponent } from "./new-section-name/Component"

const blockComponents = {
  "new-section-name": NewSectionNameComponent,
  // ... other sections
}
```

### Step 5: Build Component
Only after config registration, build the component:

```typescript
// Component.tsx template
import { cn } from "@/utilities/ui"
import type { NewSectionNameBlock } from "@/payload/payload-types"

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

**ALWAYS prefer reusable field functions** from `@/payload/fields`:

```typescript
import { 
  sectionIntro, 
  sectionCta, 
  button, 
  link,
  content 
} from "@/payload/fields"

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
import { Media } from "@/payload/components/frontend/media"
import type { HeroSplitBlock } from "@/payload/payload-types"

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
      "py-16 lg:py-24",
      colorScheme === "dark" && "bg-slate-900 text-white",
      colorScheme === "gradient" && "bg-gradient-to-br from-blue-600 to-purple-700 text-white"
    )}>
      <div className="container">
        <div className={cn(
          "grid gap-8 lg:gap-16 items-center",
          layout === "left-right" && "lg:grid-cols-2",
          layout === "right-left" && "lg:grid-cols-2",
          layout === "stacked" && "max-w-4xl mx-auto text-center"
        )}>
          <div className={cn(
            "space-y-6",
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
                className="object-cover rounded-lg"
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

## Design System Integration

### Tailwind v4 Classes

Use design system classes consistently:

```typescript
// Typography - let design system handle
<h2 className="text-display-lg">{heading}</h2>
<p className="text-body-lg text-slate-600">{description}</p>

// Spacing - use consistent scale  
<div className="space-y-6 lg:space-y-8">
<section className="py-16 lg:py-24">

// Layout - responsive patterns
<div className="grid gap-8 lg:gap-16 lg:grid-cols-2">
```

### Color Scheme Handling

```typescript
// Support multiple color schemes
const colorClasses = {
  light: "bg-white text-slate-900",
  dark: "bg-slate-900 text-white", 
  gradient: "bg-gradient-to-br from-blue-600 to-purple-700 text-white",
  brand: "bg-brand-500 text-white",
}

<section className={cn("py-16", colorClasses[colorScheme])}>
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

## Common Anti-Patterns

### ❌ Avoid These Mistakes

1. **Creating types manually**:
```typescript
// DON'T DO THIS
interface HeroProps {
  title: string
  content: string
}
// Payload generates types automatically
```

2. **Hardcoding content**:
```typescript
// DON'T DO THIS
<h2>Our Services</h2>
// Make it configurable via CMS
```

3. **Skipping registration**:
```typescript
// DON'T FORGET to add to both:
// - src/components/sections/config.ts
// - src/components/sections/RenderSections.tsx
```

4. **Content-specific naming**:
```typescript
// DON'T DO THIS
export const ServicesHero: Block = {
  slug: "services-hero"
  // Use architectural names instead
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
1. `config.ts` exports
2. `RenderSections.tsx` component mapping

### CMS Fields Not Saving

Verify field configuration matches expected Payload field types and naming conventions.

## Quality Checklist

Before considering a section complete:

- [ ] Config exported in `config.ts`  
- [ ] Component registered in `RenderSections.tsx`
- [ ] Uses architectural naming (not content-specific)
- [ ] Leverages reusable field functions where possible
- [ ] Provides helpful admin descriptions
- [ ] Includes realistic default values
- [ ] Follows Tailwind v4 design system classes
- [ ] Handles responsive behavior appropriately  
- [ ] Uses proper TypeScript types from Payload
- [ ] No hardcoded content or styles

This process ensures every section is maintainable, reusable, and integrates seamlessly with the CMS and design system.