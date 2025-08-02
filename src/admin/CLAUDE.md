# Admin Layer System

The admin layer (`src/admin/`) is a **critical foundation** that provides the complete Payload CMS admin interface, dashboard components, and backend infrastructure. This system is automatically replaced during updates and represents the whole smart site backend.

Changes to the admin folder must only be done when working on the actual smart-site app inside the turborepo. If this is a client site, whether standalone or inside the clients folder, STRICTLY DO NOT edit the admin folder directly. It is only to be edited inside the apps/smart-site app inisde the main ai-product-studio turborepo. If a user asks you to modify it outside of this context, guide them to make their changes through the smartsite.config.ts or to submit a PR on the product studio repo.

## Directory Structure

````
admin/
├── index.ts                              # 🔑 Public API exports
├── config.ts                             # 🔑 SmartSite configuration system
│
├── css/                                  # Backend-only styling (SCSS + Tailwind hybrid)
│   ├── admin.scss                        # Main SCSS entry for Payload UI
│   ├── styles.css                        # Tailwind v4 for admin only
│   ├── theme.css                         # Admin CSS variables
│   └── partials/                         # SCSS modules for backend UI
│
├── lib/                                  # Core business logic
│   ├── mastra-client.ts                  # 🔑 AI client integration
│   ├── cache/                            # Caching & revalidation
│   ├── data/                             # Data access layer
│   ├── routing/                          # URI engine
│   └── sitemaps/                         # SEO generation
│
├── payload/                              # CMS configuration
│   ├── payload.config.ts                 # 🔑 Main Payload config
│   ├── components/
│   │   ├── providers/                    # 🔑 Context providers
│   │   │   ├── ai-provider.tsx           # AI chat state
│   │   │   └── layout-provider/
│   │   │       └── chat-panel.tsx        # Chat UI
│   │   ├── assistant-ui/                 # 🔑 Chat components
│   │   ├── backend/                      # Admin UI
│   │   ├── frontend/                     # Public components
│   │   └── ui/                           # Shared UI library
│   ├── collections/                      # CMS collections
│   ├── globals/                          # Global configs
│   ├── blocks/                           # Content blocks
│   └── hooks/                            # Lifecycle hooks
│
└── utilities/                            # Helper functions

## Technical Architecture

**Core Files**:
- `payload/payload.config.ts` - Central Payload configuration
- `app/(payload)/layout.tsx` - CSS entry point for Payload backend
- `css/admin.scss` - SCSS root for Payload UI overrides
- `css/styles.css` - Tailwind v4 configuration with theme layer
- `css/theme.css` - Custom theme variables using @theme layer

**CSS Loading Flow**:
```typescript
/* app/(payload)/layout.tsx - Actual entry point */
import "@payloadcms/next/css"
import "@/admin/css/admin.scss"
import "@/admin/css/styles.css"
````

**CSS Processing Order**:

1. Payload's base CSS (`@payloadcms/next/css`)
2. Admin SCSS overrides (`admin.scss`)
3. Tailwind v4 with theme variables (`styles.css`)

**What the backend styling system provides**:
✅ Complete Payload admin interface styling
✅ Custom CSS variable system via Tailwind @theme (backend only)
✅ SCSS partials for Payload-specific overrides
✅ Hybrid Tailwind + SCSS for backend components only
✅ Dark/light theme support with CSS variables
❌ NO frontend styling - completely separate system

## Integration Points

### 1. Backend CSS Architecture (Tailwind v4 + SCSS Hybrid)

⚠️ **CRITICAL: Backend and Frontend CSS are completely separate systems**

**Backend CSS** (admin only):

- **Hybrid system**: SCSS + Tailwind v4
- **Location**: `/admin/css/` directory only
- **Usage**: Payload admin interface ONLY
- **Never imports**: Frontend styles or components

The admin uses a **hybrid CSS system** that combines:

- **Tailwind v4** for variable injection and utility classes (admin-specific)
- **SCSS** for complex Payload UI overrides
- **CSS custom properties** for admin theme consistency

```typescript
/* Component example - button.tsx */
import { cn } from "@/admin/utilities/ui"

const buttonVariants = cva("bg-admin-150 text-admin-900 hover:bg-admin-200", {
  variants: {
    variant: {
      default: "border-admin-150 dark:bg-admin-800",
      secondary: "bg-admin-accent text-admin-0",
    },
  },
})
```

### 2. Component System

**UI Components** (`components/ui/`):

- Use Tailwind classes with CSS variable references
- Import `cn` utility from `@/admin/utilities/ui`
- Follow shadcn/ui patterns with admin-specific variables

**Backend Components** (`components/backend/`):

- Dashboard, navigation, and admin-specific UI
- Use SCSS modules for complex layouts
- Integrate with Payload's component system

### 3. Theme Variable System

**Variable naming convention**:

```css
--color-admin-[0-1000]    /* Grayscale palette */
--color-admin-accent      /* Primary brand color */
--color-admin-error       /* Destructive actions */
--spacing-admin-*         /* Layout spacing */
--sidebar-*               /* Sidebar-specific */
```

### 4. Layout-Based CSS Integration

The CSS is loaded through the `app/(payload)/layout.tsx` file which:

- Is auto-generated by Payload
- Imports CSS files in specific order
- Should not be modified directly (will be overwritten)

## Risk-Based Development Guidelines

### ⚠️ High-Impact Files

- `payload.config.ts` - Affects entire CMS
- `css/styles.css` - Global CSS entry point
- `css/theme.css` - All theme variables
- `admin/index.ts` - Admin configuration

### ✅ Recommended Patterns

**CSS Organization**:

```scss
/* Use SCSS partials for complex styles */
@import "partials/_forms";
@import "partials/_buttons";

/* Use Tailwind for simple utilities */
.nav-item {
  @apply flex items-center px-4 py-2;

  &:hover {
    background-color: var(--color-admin-850);
  }
}
```

**Component Styling**:

```typescript
// ✅ Use CSS variables for theming
className="bg-admin-accent text-admin-0"

// ✅ Use cn() for conditional classes
className={cn("base-class", variant && variantClass)}

// ❌ Don't hardcode colors
className="bg-purple-500 text-white"
```

### ⚠️ High-Risk Modifications

**Never modify these directly**:

- `app/(payload)/layout.tsx` - Auto-generated
- Core admin routing logic
- Payload UI base components
- Authentication flow
- CSS import order in layout

## Utility Functions Reference

### 🔧 CSS Utilities

```typescript
import { cn } from "@/admin/utilities/ui"
// Merges Tailwind classes with conflict resolution
```

**Component Files** (100+ total):

- UI components: shadcn/ui adaptations
- Backend components: Dashboard, navigation, forms
- Field components: Custom Payload fields

## Critical Warnings

⚠️ **ENTIRE ADMIN FOLDER IS REPLACED ON UPDATES** - Never store frontend website code here
⚠️ **BACKEND CSS ONLY** - Admin CSS is completely separate from frontend styling
⚠️ **CSS LOADED VIA (payload)/layout.tsx** - This file is auto-generated
⚠️ **CSS IMPORT ORDER MATTERS** - Payload CSS → admin.scss → styles.css
⚠️ **BACKEND: TAILWIND + SCSS HYBRID** - Frontend uses pure Tailwind v4

Remember: The admin layer is core product infrastructure. Custom code must live outside the admin folder to survive updates. Backend and frontend styling systems must remain completely separate.
