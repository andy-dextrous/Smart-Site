# CLAUDE.md - Component Development Guide

This file provides guidance for Claude Code when working with components in smart-site.

## GSAP Animation Integration

### Setup Requirements

**GSAP is enabled by default** - you don't need to configure it unless debugging. Also, MANY gsap plugins are exported from the SAME provider.

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

- **Use `will-change-transform will-change-opacity`** tailwind classes for animated elements
- **Prefer animating transform properties** (`x`, `y`, `scale`, `rotation`) over layout properties

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

**2. Complex Styles Go in components.css (should be very rare and ask user first)**

```css
/* components.css - For reusable component patterns */
.button-gradient {
  background: linear-gradient(
    135deg,
    var(--color-primary-500),
    var(--color-secondary-500)
  );
}

.card-elevated {
  @apply bg-white p-content rounded-lg shadow-lg;
}
```

**3. Component Class Usage**

```typescript
// ✅ Use component classes for complex patterns
<button className="button-gradient px-content py-content-sm">Click me</button>
<div className="card-elevated">{children}</div>

// ❌ WRONG - Inline very complex styles
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
import RichText from "@/components/fields/rich-text"

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
import { Media } from "@/components/fields/media"

// Basic usage
<Media resource={image} alt={image?.alt || ""} fill imgClassName="object-cover" />

// With responsive sizing
<Media resource={image} alt="" className="aspect-video" />
```

### CMSLink Component

**ALWAYS use CMSLink for Payload CMS links**:

```typescript
import { CMSLink } from "@/components/fields/link"

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

### React Component File Structure

**For large React components, organize files in this exact order**:

1. Imports
2. Type declarations (if any)
3. Static data (if any)
4. Component declaration with block header
5. State/Refs/Constants
6. Standard functions (with block header)
7. Event handlers (with block header)
8. Utility functions (with block header)
9. Remaining non-JSX code
10. JSX

### Component Development Checklist

**Before creating any component**:

1. **Check existing components** in `/components/` for similar patterns
2. **Review design system tokens** in `theme.css` and `components.css`
3. **Use component classes** for complex styles instead of inline
4. **Follow spacing patterns** with flex/gap instead of margins
5. **Use Media/CMSLink components** for CMS integration

## Data Fetching Patterns for Components

### Admin Data Access Layer

**CRITICAL**: Frontend components must use the admin data access layer for all CMS content. Never bypass this system.

**Import Pattern**:
```typescript
// ✅ CORRECT - Use admin data access functions
import { getRecentPosts } from "@/admin/lib/data/posts"
import { getGlobal } from "@/admin/lib/data/globals" 
import { cache } from "@/admin/lib/cache"

// ❌ WRONG - Don't use Payload directly in frontend
import { getPayload } from "payload"
```

### Section Components Receive Data via Props

**IMPORTANT**: Section components automatically receive their configured CMS data via props. Additional data fetching is only needed for external content not configured in the section's fields.

```typescript
// Most common pattern - Section uses only props data
export const HeroSectionComponent: React.FC<HeroSectionBlock> = props => {
  const { heading, description, backgroundImage, button } = props

  // No data fetching needed - all content comes from CMS fields
  return (
    <section>
      <div className="container">
        <SectionIntro heading={heading} description={description} />
        <CMSLink {...button} />
      </div>
    </section>
  )
}

// Less common - Section needs additional data not in its fields
export const LatestArticlesComponent: React.FC<LatestArticlesBlock> = async props => {
  const { heading, description, showCount = 3 } = props

  // Additional data fetching for content not configured in section fields
  const posts = await getRecentPosts(showCount)

  return (
    <section>
      <div className="container">
        <SectionIntro heading={heading} description={description} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  )
}
```

### Available Data Access Functions

**Global Content**:
```typescript
import { getSettings, getHomepage, getGlobal } from "@/admin/lib/data/globals"

// Site settings
const settings = await getSettings()

// Homepage content
const homepage = await getHomepage()

// Any global by slug
const header = await getGlobal("header")
const footer = await getGlobal("footer")
```

**Collection Content**:
```typescript
import { getRecentPosts, getPostBySlug } from "@/admin/lib/data/posts"
import { cache } from "@/admin/lib/cache"

// Recent posts (limited)
const recentPosts = await getRecentPosts()

// Specific post by slug
const post = await getPostBySlug("my-blog-post")

// Direct cache access for any collection
const pages = await cache.getCollection("pages", {
  where: { _status: { equals: "published" } },
  limit: 10
})

// Single document by URI (primary method)
const content = await cache.getByURI("/about/team")

// Single document by slug
const page = await cache.getBySlug("pages", "about")
```

### Data Fetching in Different Component Types

**Section Components** (typically use props only):
```typescript
// ✅ Most common - Section configured with relationship fields in CMS
export const TeamGridComponent: React.FC<TeamGridBlock> = props => {
  const { heading, description, teamMembers } = props
  
  // teamMembers comes from CMS relationship field - no fetching needed
  return (
    <section>
      <SectionIntro heading={heading} description={description} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {teamMembers?.map(member => (
          <TeamCard key={member.id} member={member} />
        ))}
      </div>
    </section>
  )
}

// ⚠️ Less common - When section needs dynamic data not configured in fields
export const RecentTeamComponent: React.FC<RecentTeamBlock> = async props => {
  const { heading, description, limit = 6 } = props
  
  // Only fetch when content can't be configured in section fields
  const teamMembers = await cache.getCollection("team", {
    where: { _status: { equals: "published" } },
    sort: "-createdAt",
    limit
  })

  return (
    <section>
      <SectionIntro heading={heading} description={description} />
      {teamMembers.map(member => (
        <TeamCard key={member.id} member={member} />
      ))}
    </section>
  )
}
```

**Layout Components** (header/footer):
```typescript
export async function Header() {
  const header = await getGlobal("header") 
  const settings = await getSettings()

  return (
    <header>
      <nav>
        {header.navigation?.map(item => (
          <CMSLink key={item.id} {...item} />
        ))}
      </nav>
    </header>
  )
}
```

**Post/Article Components**:
```typescript
export async function PostsList() {
  const posts = await getRecentPosts()
  
  return (
    <div className="grid gap-8">
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
```

### Client Component Data Patterns

**Most components should be server components**. Use client components only for interactivity:

```typescript
"use client"

// Client components receive data as props, never fetch directly
export function InteractivePostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(false)

  return (
    <article>
      <h3>{post.title}</h3>
      <button onClick={() => setLiked(!liked)}>
        {liked ? "Unlike" : "Like"}
      </button>
    </article>
  )
}
```

### Type Safety with Data Fetching

**Use Payload-generated types**:
```typescript
import type { Post, Page, Media } from "@/admin/payload/payload-types"

// Component props match CMS data structure
export function PostCard({ post }: { post: Post }) {
  return (
    <article>
      <h3>{post.title}</h3>
      {post.heroImage && typeof post.heroImage === "object" && (
        <Media resource={post.heroImage as Media} alt={post.title} />
      )}
    </article>
  )
}
```

### Data Fetching Best Practices

**1. Always use the cache system**:
```typescript
// ✅ Cached and fast
const posts = await cache.getCollection("posts")

// ❌ Bypasses cache, slower
const payload = await getPayload()
const posts = await payload.find({ collection: "posts" })
```

**2. Prefer CMS configuration over data fetching**:
```typescript
// ✅ Best - Configure content in section fields (CMS relationship)
export const BlogSectionComponent: React.FC<BlogSectionBlock> = props => {
  const { heading, featuredPosts } = props // comes from CMS fields
  
  return (
    <section>
      <SectionIntro heading={heading} />
      {featuredPosts?.map(post => <PostCard post={post} />)}
    </section>
  )
}

// ✅ Good - Fetch when content must be dynamic
export const RecentBlogComponent = async (props: RecentBlogBlock) => {
  const { heading, count = 3 } = props
  const posts = await getRecentPosts(count) // Dynamic data not configurable in CMS
  
  return (
    <section>
      <SectionIntro heading={heading} />
      {posts.map(post => <PostCard post={post} />)}
    </section>
  )
}

// ❌ Don't fetch in individual components
export const PostCard = async ({ postId }) => {
  const post = await cache.getByID("posts", postId) // Inefficient
  return <article>{post.title}</article>
}
```

**3. Handle loading states appropriately**:
```typescript
// Data fetching happens on server, so no loading states needed
export const PostsList = async () => {
  const posts = await getRecentPosts()
  
  if (!posts.length) {
    return <div>No posts found</div>
  }

  return <div>{/* render posts */}</div>
}
```

### Common Data Fetching Patterns

**Archive/Listing Components**:
```typescript
const posts = await cache.getCollection("posts", {
  where: { 
    _status: { equals: "published" },
    category: { equals: "technology" }
  },
  sort: "-publishedDate",
  limit: 12
})
```

**Related Content**:
```typescript
const relatedPosts = await cache.getCollection("posts", {
  where: {
    _status: { equals: "published" },
    id: { not_equals: currentPost.id },
    tags: { in: currentPost.tags }
  },
  limit: 3
})
```

**Navigation Data**:
```typescript
const navigation = await cache.getCollection("pages", {
  where: { 
    _status: { equals: "published" },
    includeInNav: { equals: true }
  },
  sort: "navOrder"
})
```

Remember: The admin data access layer provides optimized, cached access to all CMS content. Always use these functions instead of bypassing to Payload directly.

## Understanding Fields, Blocks, and Sections

Smart-site uses three distinct component types that work together to create a powerful, consistent content management system:

### Fields (`/components/fields/`)

**Purpose**: Reusable configuration functions that create consistent data structures across the CMS.

**Key Insight**: Fields establish a **1:1 mapping between CMS configuration and React components**. Every field configuration function has a corresponding React component for rendering.

**Examples**:
- `sectionIntro()` → `<SectionIntro />` - Heading + description
- `sectionCta()` → `<SectionCta />` - Text + button call-to-action
- `button()` → `<CMSLink />` - Button with variants
- `link()` → `<CMSLink />` - Internal/external links
- `content()` → `<RichText />` - Rich text content

**Why Fields Matter**:
- **Consistency**: Same field structure everywhere means predictable data
- **Reusability**: Define once, use in sections, blocks, collections
- **Type Safety**: Payload generates types from field configs automatically
- **Developer Speed**: No need to recreate common patterns

### Blocks (`/components/blocks/`)

**Purpose**: Self-contained content elements that can be embedded within rich text fields or used as page building blocks.

**Characteristics**:
- Insertable within posts, pages, or any rich text field
- Smaller scope than sections (not full-width)
- Perfect for dynamic content within articles

**Examples**:
- `FormBlock` - Embed forms from the forms collection
- `MediaBlock` - Images/videos with captions
- `CodeBlock` - Syntax-highlighted code snippets

**When to Use**: When content needs to be inserted flexibly within text or when building rich content experiences.

### Sections (`/components/sections/`)

**Purpose**: Full-width architectural layouts that stack vertically to create complete pages.

**Key Principles**:
- Named for structure, not content (`hero-split` not `about-hero`)
- Always render as `<section>` elements
- Compose multiple fields for maximum flexibility
- Receive page context props automatically

**Field Integration**: Sections heavily leverage field functions:
```typescript
fields: [
  sectionIntro(),      // Reusable heading + description
  content(),           // Rich text field
  sectionCta(),        // Call-to-action with button
  // Custom fields as needed
]
```

**The Big Picture**: 90% of development is building sections from designs, leveraging consistent field patterns throughout.

## Section Development

For detailed section creation workflows, see [sections CLAUDE.md](./sections/CLAUDE.md). This includes:
- Step-by-step section creation process
- Field configuration strategies  
- Component implementation patterns
- Registration requirements
- Troubleshooting guides

## Key Takeaways

**Component development in smart-site focuses on**:

- **Server-side data fetching** using the admin cache system and data access layer
- **GSAP animations (when asked, don't assume)** with proper scoping and performance
- **Design system adherence** using existing tokens and patterns
- **CMS component integration** with Media, CMSLink, and RichText
- **Tailwind v4 patterns** using CSS-first configuration and component classes
- **Consistent spacing** with flex/gap patterns instead of margins
- **Type safety** using Payload-generated types for all CMS data
