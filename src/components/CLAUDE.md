# CLAUDE.md - Component Development Guide

This file provides guidance for Claude Code when working with components in smart-site, including GSAP animations, Tailwind CSS v4, and component patterns.

## GSAP Animation Integration

### Setup Requirements

**GSAP is enabled by default** - you don't need to configure it unless debugging.

**CRITICAL - Provider Import**:

```typescript
// ✅ CORRECT - Use custom provider
import { useGSAP, gsap } from "@/providers/gsap"

// ❌ WRONG - Don't import from node_modules
import { useGSAP } from "@gsap/react"
import { gsap } from "gsap"
```

**Client Component Requirement**:

```typescript
"use client"

import { useGSAP, gsap } from "@/providers/gsap"
import { useRef } from "react"

export const AnimatedComponent = () => {
  // Animation implementation
}
```

### Component Animation Patterns

**Standard component animation structure**:

```typescript
"use client"

import { useGSAP, gsap } from "@/providers/gsap"
import { useRef } from "react"

export const AnimatedComponent = (props) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      // Animation timeline - scoped to container only
      gsap.fromTo(
        "h1",
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
      )
    },
    { scope: containerRef } // CRITICAL: Always use scope
  )

  return (
    <div ref={containerRef}>
      <h1>Animated content</h1>
      {/* All animated elements must be within scoped container */}
    </div>
  )
}
```

### Animation Rules for Components

**1. Always Use Scoping**
- **NEVER animate without scope** - could affect other page elements
- **Use refs for scoping** to avoid class/attribute conflicts
- **Scope allows simple selectors** like `"h1"`, `"p"`, `".button"`

**2. Component-Level Performance**
- **Use `will-change: transform, opacity`** for animated elements
- **Prefer transform properties** (`x`, `y`, `scale`, `rotation`) over layout properties
- **Add `force3D: true`** for complex animations to enable hardware acceleration

**3. Animation Cleanup**
- **`useGSAP` handles cleanup automatically** for most cases
- **For complex timelines**, return cleanup function if needed

```typescript
useGSAP(
  () => {
    const tl = gsap.timeline()
    // Create animations
    return () => tl.kill() // Manual cleanup if needed
  },
  { scope: containerRef }
)
```

## Tailwind CSS v4 - Component Styling

### 🚨 Design System Adherence - Critical for Components

**NEVER create component styles without checking the existing design system first:**

1. **ALWAYS use existing design tokens** from CSS files
2. **Check other components** for existing patterns before creating new ones  
3. **Use design system tokens** instead of generic Tailwind classes
4. **Reference similar components** when design tokens don't exist

**Component styling priority**:

```typescript
// ✅ FIRST: Use design system tokens
<Button className="bg-primary-500 text-white">

// ✅ SECOND: Check existing component patterns  
// Look at other components in /components/ for inspiration

// ❌ NEVER: Generic classes without checking system
<Button className="bg-blue-500 text-white"> // Don't do this!
```

### Tailwind v4 Component Implementation

**Key changes for component development**:

- **CSS-first configuration** - all styling is defined in CSS files, not JavaScript
- **CSS variables auto-generate utilities** - declare once in `@theme`, use everywhere
- **Component classes** go in `components.css` for reusable patterns

**Important files for components**:
- **`theme.css`** - Design tokens and color variables
- **`components.css`** - Reusable component classes  
- **`base.css`** - Base element styles (typography, containers)

### Component Styling Patterns

**1. Use Design System Tokens**

```typescript
// ✅ CORRECT - Use existing design tokens
<div className="bg-primary-500 text-white p-content gap-content-sm">

// ❌ WRONG - Generic Tailwind classes
<div className="bg-blue-500 text-white p-6 gap-3">
```

**2. Complex Styles Go in components.css**

```css
/* components.css - For reusable component patterns */
.button-gradient {
  background: linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500));
}

.card-elevated {
  @apply bg-surface-elevated shadow-lg rounded-lg p-content;
}
```

**3. Component Class Usage**

```typescript
// ✅ Use component classes for complex patterns
<button className="button-gradient px-content py-content-sm">Click me</button>
<div className="card-elevated">{children}</div>

// ❌ WRONG - Inline complex styles
<div className="bg-gradient-to-br from-primary-500 via-secondary-400 to-primary-600">
```

### Component Layout Patterns

**1. Use Flex with Gaps (Not Margins)**

```typescript
// ❌ WRONG - Individual margins
<div>
  <h2 className="mb-4">Title</h2>
  <p className="mb-6">Description</p>
  <button className="mt-8">Action</button>
</div>

// ✅ CORRECT - Flex with gap
<div className="flex flex-col gap-content">
  <h2>Title</h2>
  <p>Description</p>
  <button>Action</button>
</div>
```

**2. Component Spacing Variables**

```typescript
// ✅ Component-level spacing examples
<div className="flex flex-col gap-content">       {/* Default */}
<div className="flex flex-col gap-content-sm">    {/* Tight */}
<div className="flex flex-col gap-content-lg">    {/* Loose */}
```

### Component Styling Rules

**1. Typography - Use Semantic HTML**

```typescript
// ❌ WRONG - Manual typography classes
<h1 className="text-4xl font-bold">Title</h1>

// ✅ CORRECT - Let typography.css handle it
<h1>Title</h1>
<h2 className="display-lg">Large heading</h2> {/* Only when needed */}
```

**2. Never Use Style Tags**

```typescript
// ❌ WRONG - Inline styles
<style>{`.custom { background: blue; }`}</style>

// ✅ CORRECT - Add to components.css then use
/* components.css */
.custom-component {
  background: var(--color-primary-500);
  @apply p-content rounded-lg;
}
```

```typescript
// Usage in component
<div className="custom-component">Content</div>
```

## CMS Integration Components

### RichText Component

**ALWAYS use RichText for Payload CMS content**:

```typescript
import RichText from "@/admin/payload/components/frontend/rich-text"

// Basic usage
<div className="prose max-w-none">
  <RichText data={content} />
</div>

// With targeted styling
<div className="prose prose-headings:text-primary-600 prose-a:text-secondary-500">
  <RichText data={content} />
</div>
```

### Media Component

**ALWAYS use Media component for Payload CMS images**:

```typescript
import { Media } from "@/admin/payload/components/frontend/media"

// Basic usage
<Media resource={image} alt={image?.alt || ""} fill imgClassName="object-cover" />

// With responsive sizing
<Media resource={image} alt="" className="aspect-video" />
```

### CMSLink Component

**ALWAYS use CMSLink for Payload CMS links**:

```typescript
import { CMSLink } from "@/admin/payload/components/frontend/cms-link"

// Button styling
<CMSLink {...linkData} appearance="default" size="lg">
  {linkData.label}
</CMSLink>

// Inline link styling  
<CMSLink {...linkData} appearance="inline">
  {linkData.label}
</CMSLink>
```

### Component Variants (Advanced)

**For complex component variants, use tailwind-variants**:

```typescript
import { tv } from "tailwind-variants"

const button = tv({
  base: "rounded-md px-content py-content-sm font-medium",
  variants: {
    variant: {
      primary: "bg-primary-500 text-white hover:bg-primary-600",
      secondary: "bg-secondary-500 text-white hover:bg-secondary-600",
    },
  },
  defaultVariants: { variant: "primary" },
})

// Usage
<button className={button({ variant: "secondary" })}>Click me</button>
```

### Component Development Checklist

**Before creating any component**:
1. **Check existing components** in `/components/` for similar patterns
2. **Review design system tokens** in `theme.css` and `components.css`
3. **Use component classes** for complex styles instead of inline
4. **Follow spacing patterns** with flex/gap instead of margins
5. **Use Media/CMSLink components** for CMS integration

## Key Takeaways

**Component development in smart-site focuses on**:
- **GSAP animations** with proper scoping and performance
- **Design system adherence** using existing tokens and patterns
- **CMS component integration** with Media, CMSLink, and RichText
- **Tailwind v4 patterns** using CSS-first configuration and component classes
- **Consistent spacing** with flex/gap patterns instead of margins
