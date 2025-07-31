# Smart Site - Modern Website Starter

A powerful website starter built with **Next.js 15+**, **Payload CMS**, **Tailwind CSS v4**, **GSAP**, and **AI integration via remote Mastra backend**, designed for rapid development of section-based websites with enterprise-grade routing and caching.

## 📋 Table of Contents

- [Installation & Getting Started](#installation--getting-started)
- [Repository Overview](#repository-overview)
- [AI Backend Integration](#ai-backend-integration)
- [Building a Website](#building-a-website)
- [How Routing Works](#how-routing-works)
- [Lib Folder Structure](#lib-folder-structure)
- [Cursor Rules](#cursor-rules)
- [Configuration](#configuration)
- [Deployment](#deployment)

## 🚀 Installation & Getting Started

### Prerequisites

- **Node.js 20+**
- **pnpm** (preferred package manager)
- **Database**: PostgreSQL or MongoDB
- **File Storage**: Vercel Blob (recommended) or other storage solution
- **AI Backend**: Smart Site AI server (separate installation)

### 1. Project Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd smart-site

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env.local
```

### 2. Environment Configuration

Configure your `.env.local` file with the following variables:

```bash
# Database Configuration (choose one)
# FOR MONGODB:
DATABASE_PROVIDER=mongoose
DATABASE_URL=mongodb+srv://...

# FOR POSTGRES:
DATABASE_PROVIDER=postgres
DATABASE_URL="postgres://..."

# Payload CMS Configuration
PAYLOAD_SECRET=your-unique-secret-key              # Create any random secret string
PREVIEW_SECRET=your-preview-secret                 # Create any short nanoid string
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...           # Vercel Blob storage token
RESEND_API_KEY=re_...                             # Resend email service API key

# Payload Config Path
PAYLOAD_CONFIG_PATH=./src/admin/payload/payload.config.ts
NEXT_PUBLIC_URL=http://localhost:3000
NEXT_PUBLIC_AI_URL=http://localhost:4112           # AI backend URL

# Admin User (for seeding)
PAYLOAD_ADMIN_EMAIL="user@example.com"
PAYLOAD_ADMIN_PASSWORD=your-strong-password        # Will be created during seeding
```

### 3. Database Setup

#### Option A: MongoDB (Recommended)

1. Set up MongoDB (local or Atlas)
2. Set `DATABASE_PROVIDER=mongoose`
3. Add your `DATABASE_URI` to `.env.local`

#### Option B: Vercel PostgreSQL

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Storage** → **Create Database** → **Postgres**
3. Copy the `POSTGRES_URL` to your `.env.local`

### 4. AI Backend Setup

Smart Site requires a separate AI backend service. See the [AI Backend Integration](#ai-backend-integration) section for setup instructions.

### 5. Development Server

```bash
# Start development server
pnpm dev

# Fresh development start (resets database and seeds data)
pnpm dev:fresh
```

### 6. Database Seeding & Initial Setup

> **🗃️ Important:** Before you start building, seed your database with sample content for the best development experience.

#### **Automatic Seeding (Recommended)**

```bash
# Start fresh with a clean database and sample content
pnpm dev:fresh

# Or seed manually after starting the server
pnpm seed
```

#### **Manual Seeding via Admin Panel**

1. **Start the development server**: `pnpm dev`
2. **Access the admin panel**: Navigate to `http://localhost:3000/admin`
3. **Create your admin user**: Follow the setup wizard
4. **Seed via API**: Make a POST request to `http://localhost:3000/api/seed`

   ```bash
   # Command line seeding
   curl -X POST http://localhost:3000/api/seed
   ```

#### **What Gets Seeded**

The seeding process creates realistic sample content including:

- **Pages**: Homepage, About, Services, Contact with realistic content
- **Posts**: Blog posts with proper categories and tags
- **Services**: Sample service offerings with descriptions
- **Media**: Sample images and documents
- **Forms**: Contact forms and lead capture forms
- **Navigation**: Main navigation and footer structures
- **Users**: Admin user (if none exists)
- **Templates**: Page templates and section configurations
- **Categories**: Content categorization and taxonomies

> **💡 Pro Tip:** The seeded content follows all design system patterns and provides excellent examples for building your own sections.

### 7. Available Scripts

```bash
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint issues
pnpm type-check       # Run TypeScript checks

# Database & Content Management
pnpm db:schema        # Generate database schema
pnpm db:reset         # Reset database and seed data
pnpm seed             # Seed database with sample content
pnpm regenerate-uris  # Regenerate URI index for routing

# Payload CMS Commands
pnpm payload          # Access Payload CLI
pnpm generate:types   # Generate TypeScript types from Payload
```

## 📁 Repository Overview

### Architecture Philosophy

Smart Site uses a **section-first approach** to website building, where every page is composed of reusable section blocks managed through Payload CMS. The AI functionality is provided by a separate backend service, ensuring clean separation of concerns and scalable architecture.

> **🎯 Cursor AI Tip:** The cursor rule `smart-site/adding-new-sections` automates the entire section creation process - just tell your AI agent "create a new section" and it handles the rest!

### Key Technologies

- **Next.js 15+**: React framework with App Router
- **Payload CMS**: Headless CMS with block-based content management
- **Tailwind CSS v4**: Utility-first CSS framework with design system
- **GSAP**: Professional-grade animations
- **@mastra/client-js**: AI integration via remote Mastra backend
- **TypeScript**: Type safety throughout the application

### Directory Structure (Frontend-Focused)

> **⚠️ IMPORTANT**: Never directly modify files in the `src/admin/` directory. All customizations should be done through `smartsite.config.ts` to maintain clean separation between admin/frontend code.

```
src/
├── app/                          # Next.js App Router
│   ├── (frontend)/              # 🎯 PUBLIC WEBSITE - Your main development area
│   │   ├── [[...uri]]/          # Dynamic routing for all pages
│   │   ├── css/                 # Tailwind v4 configuration
│   │   └── api/                 # Frontend API routes (AI, preview, etc.)
│   └── (payload)/               # CMS admin routes (don't modify)
├── components/                   # 🎯 FRONTEND COMPONENTS - Primary development area
│   ├── sections/                # 📍 Section blocks (90% of development time)
│   │   ├── config.ts            # Section registration
│   │   ├── sections-map.tsx     # Component mapping
│   │   └── [section-name]/      # Individual section folders
│   │       ├── Component.tsx    # React component
│   │       └── config.ts        # CMS fields configuration
│   ├── layout/                  # Reusable layout components (SectionIntro, etc.)
│   ├── ui/                      # ShadCN UI components
│   ├── header/                  # Header components
│   ├── footer/                  # Footer components
│   └── posts/                   # Blog/post components
├── providers/                   # React context providers
│   └── gsap/                    # GSAP animation setup
├── utilities/                   # Frontend utility functions
├── hooks/                       # Custom React hooks
├── types/                       # TypeScript type definitions
├── middleware.ts                # Next.js middleware
├── smartsite.config.ts          # 🎯 MAIN CONFIG - All customizations go here
└── admin/                       # ⛔ PROTECTED - Don't modify directly
    ├── config.ts                # Base admin configuration
    ├── payload/                 # Complete CMS setup
    │   ├── collections/         # Content types (Pages, Posts, etc.)
    │   ├── fields/              # Reusable field patterns
    │   ├── blocks/              # Available section blocks
    │   └── payload.config.ts    # Generated from smartsite.config.ts
    └── lib/                     # Admin business logic
```

> **🏗️ HTML Structure Tip:** Use the cursor rule `smart-site/html-structure` to understand how semantic HTML should be structured throughout the application.

## 🤖 AI Backend Integration

Smart Site integrates with AI functionality via a separate **Smart Site AI** backend service, ensuring clean architecture and IP protection.

### Architecture Overview

```
┌─────────────────┐     HTTP API     ┌─────────────────┐
│   Smart Site    │ ◄──────────────► │ Smart Site AI   │
│   (Frontend)    │                  │   (Backend)     │
│                 │                  │                 │
│ • Next.js       │                  │ • Mastra Core   │
│ • Payload CMS   │                  │ • AI Agents     │
│ • UI Components │                  │ • Workflows     │
│ • Client SDK    │                  │ • LibSQL Store  │
└─────────────────┘                  └─────────────────┘
```

### Client Configuration

AI integration is configured in `src/smartsite.config.ts`:

```typescript
export default defineConfig({
  settings: {
    ai: {
      enabled: true,
      url: "http://localhost:4112", // Development
      // url: "https://your-ai-backend.vercel.app", // Production
    },
  },
})
```

### AI Features Available

- **Chat Assistant**: AI-powered chat in the admin panel
- **Content Generation**: AI-assisted content creation
- **SEO Optimization**: Automated SEO suggestions
- **Content Analysis**: Smart content analysis and recommendations

### Production Deployment

For production, deploy the AI backend separately and update the URL in your config:

```typescript
ai: {
  enabled: true,
  url: "https://your-ai-backend.vercel.app",
}
```

## 🏗️ Building a Website

### Understanding the Section System

Smart Site is built around the concept of **sections** - reusable content blocks that can be combined to create pages. Each section consists of:

1. **Configuration** (`config.ts`) - Defines CMS fields and admin interface
2. **Component** (`Component.tsx`) - React component that renders the section

> **⚡ Quick Start:** Use the cursor rule `smart-site/adding-new-sections` - your AI agent will guide you through creating sections with proper patterns automatically!

### Section Creation Workflow

> **🤖 AI-Powered Section Creation:** Just tell your AI agent "create a new section called hero-banner" and the `smart-site/adding-new-sections` rule will handle the entire process including proper field configuration and component setup.

**Every section follows the mandatory two-file pattern**:

1. **`config.ts`** - Payload CMS field configuration
2. **`Component.tsx`** - React component implementation

#### Step 1: Create Section Directory

```bash
# Always use kebab-case naming
mkdir src/components/sections/hero-banner
```

#### Step 2: Create Config First (Always start here)

**`src/components/sections/hero-banner/config.ts`**

```typescript
import type { Block } from "payload"
import { sectionIntro, sectionCta } from "@/admin/payload/fields"

export const HeroBanner: Block = {
  slug: "hero-banner", // MUST match folder name
  admin: {
    group: "Hero Sections",
  },
  interfaceName: "HeroBannerBlock", // Payload generates types from this
  fields: [
    sectionIntro({
      collapsibleLabel: "Hero Content",
      headingDescription: "Main hero heading - use <span> tags for gradient text",
    }),
    sectionCta({
      collapsibleLabel: "Call to Action",
    }),
    {
      name: "backgroundImage",
      type: "upload",
      relationTo: "media",
      required: false,
      admin: {
        description: "Background image for the hero section",
      },
    },
  ],
}
```

#### Step 3: Register the Section (Required for CMS)

**A. Export in `src/components/sections/config.ts`:**

```typescript
export { HeroBanner } from "./hero-banner/config"

// Add to sectionBlocks array
export const sections = {
  sectionBlocks: [
    // ... existing sections
    HeroBanner,
  ],
}
```

**B. Map component in `src/components/sections/sections-map.tsx`:**

```typescript
import { HeroBannerComponent } from "./hero-banner/Component"

export const sectionsMap: Record<string, React.ComponentType<any>> = {
  // ... existing sections
  "hero-banner": HeroBannerComponent,
}
```

#### Step 4: Build the Component

**`src/components/sections/hero-banner/Component.tsx`**

```typescript
import { cn } from "@/utilities/ui"
import { SectionIntro, SectionCta } from "@/components/layout"
import { Media } from "@/admin/payload/components/frontend/media"
import type { HeroBannerBlock } from "@/admin/payload/payload-types"

/*************************************************************************/
/*  HERO BANNER COMPONENT
/*************************************************************************/

export const HeroBannerComponent: React.FC<HeroBannerBlock> = props => {
  const { sectionIntro, sectionCta, backgroundImage } = props

  return (
    <section className="relative min-h-screen flex items-center">
      {backgroundImage && (
        <div className="absolute inset-0 -z-10">
          <Media
            resource={backgroundImage}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="container">
        <div className="max-w-3xl">
          <SectionIntro {...sectionIntro} />
          <SectionCta {...sectionCta} />
        </div>
      </div>
    </section>
  )
}
```

#### Step 5: Use in CMS

1. **Start dev server**: `pnpm dev`
2. **Access admin**: `http://localhost:3000/admin`
3. **Create/edit page**: Add your new "Hero Banner" section
4. **Configure content**: Fill in fields and save

### Section Naming Rules

**✅ Use Architectural Names**:

- `hero-split` - Hero with content/image split
- `card-grid` - Grid of cards
- `text-image` - Text with image
- `stats-row` - Statistics in a row
- `cta-centered` - Centered call-to-action

**❌ Avoid Content-Specific Names**:

- `services-hero` - Too specific to services
- `about-section` - Page-specific
- `pricing-cards` - Business logic in name

### Reusable Field System

Smart Site includes pre-built field configurations for common patterns:

- **`sectionIntro()`** - Heading + description pattern
- **`sectionCta()`** - Call-to-action with button
- **`button()` / `buttonsGroup()`** - Button configurations
- **`link()`** - Internal/external link handling

This ensures consistency across sections and reduces development time.

> **🔧 Advanced Configuration:** The cursor rule `smart-site/payload-config` explains the complete field-to-component mapping system and how to create your own reusable patterns.

### Converting Static Components to CMS-Powered

> **🔄 Static to Dynamic:** Use the cursor rule `smart-site/converting-static-to-payload` when you need to convert existing static components to work with Payload CMS data.

### Working with Screenshots and Designs

> **📸 Design Implementation:** When recreating sections from screenshots or designs, use the cursor rule `smart-site/screenshots` - your AI agent will know how to properly implement our design system and component patterns.

## 🗺️ How Routing Works

Smart Site implements a sophisticated routing system with O(1) URI resolution and automatic dependency management.

## 0(1) Resolution System Explained

O(1) URI resolution in this app refers to a constant-time URL lookup system that resolves any URI in a single database query, regardless of site size.

The system uses a centralized URI Index Collection (`src/admin/payload/collections/uri-index.ts`) that maintains a pre-computed mapping between URIs and their source documents. When a request comes for `/about/team`, the system performs one indexed database lookup instead of traversing hierarchies or performing complex queries.

Key features:

- **Single Query Resolution**: Any URI resolves in one database hit
- **Automatic Index Maintenance**: URIs are generated and cached via Payload hooks
- **Redirect Management**: Automatic 301 redirects when URIs change
- **Dependency Tracking**: When parent pages or archive pages change, all dependent URIs update automatically via background jobs

This provides instant page resolution at scale, unlike traditional CMS systems that perform multiple queries to resolve hierarchical URLs.

### URI Index System

Every piece of frontend content gets a unique URI stored in the **URI Index Collection**:

```
/                    → Homepage
/about               → About page
/services            → Services page
/services/consulting → Service detail page
/blog                → Blog archive
/blog/my-post        → Blog post
```

### Dynamic Route Resolution

The `[[...uri]]` catch-all route handles **all** requests:

1. **URI Lookup**: Single database query against URI Index
2. **Content Resolution**: Direct fetch of the matched document
3. **Template Rendering**: Automatic template selection based on content type

### Automatic Features

- **301 Redirects**: When content URIs change, automatic redirects are created
- **Archive Integration**: Archive pages automatically list their child content
- **Hierarchy Support**: Nested page structures with automatic URI generation
- **Draft Mode**: Preview unpublished content with authentication

### Static Generation

```typescript
// All routes are pre-generated at build time
export async function generateStaticParams() {
  const allURIs = await routingEngine.getAllURIs()
  return allURIs.map(uri => ({ slug: uri.split("/").filter(Boolean) }))
}
```

## 📚 Admin Lib Structure

The `src/admin/lib/` directory contains the core business logic organized by functionality:

### `/cache` - Intelligent Caching System

- **`cache.ts`** - Universal cache API with O(1) lookups
- **`revalidation.ts`** - Smart cache invalidation
- **`config.ts`** - Cache configuration and settings

```typescript
import { cache } from "@/admin/lib/cache"

// Get any document by URI (O(1) lookup)
const page = await cache.getByURI("/about")

// Get documents by collection and slug
const post = await cache.getBySlug("posts", "my-blog-post")

// Smart cache invalidation
await revalidate({ collection: "pages", doc: updatedPage, action: "update" })
```

### `/routing` - URI Engine & Dependencies

- **`uri-engine.ts`** - Core URI generation and conflict detection
- **`index-manager.ts`** - URI Index management and bulk operations
- **`dependency-detection.ts`** - Archive and hierarchy dependency tracking

### `/data` - Data Access Layer

- **`posts.ts`** - Blog post queries and operations
- **`draft.ts`** - Draft mode and preview functionality
- **`globals.ts`** - Global settings access
- **`user.ts`** - User authentication helpers

### `/sitemaps` - SEO & Discovery

- **`generate.ts`** - Dynamic sitemap generation
- **`config.ts`** - Sitemap configuration

### `/redirects` - URL Management

- **`legacy.ts`** - Legacy URL redirect mapping
- **`automatic.ts`** - System-generated redirects

### AI Client Integration

- **`mastra-client.ts`** - Remote AI backend client configuration

### Server Actions Pattern

All admin lib modules export async functions marked with `"use server"`:

```typescript
// ✅ Correct: Server action file in admin/lib/
"use server"

export async function getPageBySlug(slug: string) {
  // Server-only logic
}

export async function updatePageContent(data: PageData) {
  // Server-only logic
}

// ❌ Don't export utilities from server action files
// export const formatDate = (date: Date) => { ... } // This breaks the server action
```

Utilities should live in `/utilities` or `/admin/utilities` depending on scope.

## 🎯 Cursor Rules

This project includes comprehensive **Cursor Rules** that provide AI-powered development guidance directly in your Cursor editor. These rules ensure consistent code patterns, proper architecture, and adherence to best practices.

> **🤖 AI-Powered Development:** All cursor rules are designed to work seamlessly with AI agents. Simply reference the appropriate rule name when asking your AI assistant to help with specific tasks!

### 📂 Available Rule Categories

The `.cursor/rules/` folder contains organized development guidelines:

#### **Smart Site Rules** (`smart-site/`)

- **`adding-new-sections.mdc`** - Step-by-step guide for creating new website sections
- **`payload-config.mdc`** - Payload CMS field and component mapping patterns
- **`tailwind.mdc`** - Tailwind v4 configuration and best practices
- **`adding-animations.mdc`** - GSAP animation implementation guide
- **`converting-static-to-payload.mdc`** - Converting static components to CMS-powered
- **`application-overview.mdc`** - High-level architecture understanding
- **`html-structure.mdc`** - Semantic HTML layout patterns
- **`screenshots.mdc`** - Converting designs/screenshots to components
- **`styling-rich-text.mdc`** - Rich text field styling guidelines

> **✍️ Rich Text Styling:** Use the cursor rule `smart-site/styling-rich-text` when you need to apply custom styles to rich text content.

#### **Behavioral Rules** (`behaviour/`)

- **`coding-rules.mdc`** - Code style, patterns, and conventions
- **`architecture.mdc`** - Project architecture principles

#### **Integration Rules** (`mastra/`, `architecture/`)

- Mastra AI framework integration patterns
- Proof-of-concept development guidelines

### 🚀 Activating Cursor Rules

#### **Automatic Activation** (Recommended)

Cursor automatically detects and applies rules based on:

- **File patterns** - Rules trigger when editing matching files
- **Context awareness** - Rules activate based on your current task

#### **Manual Triggering**

1. **Open Command Palette**: `Cmd/Ctrl + Shift + P`
2. **Search for**: "Rules: Apply Rule"
3. **Select rule**: Choose specific rule to apply
4. **Browse available**: Use "Rules: Show All Rules" to see all available guidance

#### **Rule-Specific Triggers**

- **Sections**: Work in `src/components/sections/` to trigger section creation rules
- **Payload**: Edit config files to activate CMS integration guidance
- **Animations**: Add GSAP imports to trigger animation rules
- **Styling**: Edit CSS/Tailwind files for styling guidance

### 💡 How Rules Enhance Development

#### **Smart Code Suggestions**

```tsx
// When creating a new section, rules guide you through:
// 1. ✅ Proper file structure (config.ts + Component.tsx)
// 2. ✅ Payload field configuration
// 3. ✅ Component type safety
// 4. ✅ Design system compliance
```

#### **Architecture Enforcement**

- **Consistent patterns** across all sections
- **Proper separation** of CMS config and React components
- **Type safety** with Payload-generated interfaces
- **Performance optimization** with caching patterns

#### **Onboarding Acceleration**

- **New developers** get instant context about project patterns
- **Design decisions** are documented and enforced
- **Best practices** are automatically suggested

### 🔧 Customizing Rules

Rules are designed to be **project-specific** and can be modified:

1. **Edit existing rules** in `.cursor/rules/`
2. **Add new rules** for project-specific patterns
3. **Adjust glob patterns** to target specific file types
4. **Modify descriptions** to match your team's terminology

### 📚 Rule Documentation Format

Each rule file uses this structure:

```markdown
---
description: Brief explanation of when this rule applies
globs: **/*.tsx  # File patterns that trigger this rule
alwaysApply: false
---

# Rule Content

Detailed guidance and examples...
```

These rules transform Cursor into a **smart development assistant** that understands your project's specific architecture, patterns, and requirements.

## ⚙️ Configuration

### SmartSite Config (`src/smartsite.config.ts`)

> **🚨 CRITICAL**: All configuration changes must be made through `smartsite.config.ts`. Never directly modify files in the `src/admin/` directory as this breaks the admin/frontend separation. All changes insie /admin will be overwritten each update..

```typescript
import { defineConfig } from "@/admin/config"

const smartSiteConfig = defineConfig({
  settings: {
    // Core Features
    gsap: true, // Enable GSAP animations
    smoothScroll: true, // Enable smooth scrolling
    themeToggle: false, // Enable dark/light mode toggle
    gsapDevTools: true, // GSAP dev tools in development

    // Internationalization
    i18n: false, // Enable internationalization
    // i18n: {                     // Or configure i18n options
    //   prefixDefaultLocale: false,
    //   defaultLocale: "en",
    //   locales: ["en", "es", "fr"],
    //   localeCookie: "NEXT_LOCALE",
    // },

    // AI Integration
    ai: {
      enabled: true, // Enable AI features
      url: process.env.NEXT_PUBLIC_AI_URL, // AI backend URL
    },
    // ai: false,                  // Or disable completely

    // Content & SEO
    search: true, // Enable search functionality
    analytics: true, // Enable analytics tracking
    templateSupport: true, // Enable page templates
    sitemaps: true, // Generate XML sitemaps

    // Media Storage Configuration
    media: {
      storage: "local", // "local" | "vercel" | "s3" | "uploadThing"
      // Vercel Blob Storage (requires BLOB_READ_WRITE_TOKEN)
      vercel: {
        token: process.env.BLOB_READ_WRITE_TOKEN, // Optional, falls back to env
        cacheControlMaxAge: 60 * 60 * 24 * 365, // 1 year cache
      },
      // AWS S3 Storage (not yet implemented)
      s3: {
        bucket: "my-bucket",
        region: "us-east-1",
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        endpoint: "https://s3.amazonaws.com", // Optional
      },
      // UploadThing Storage (not yet implemented)
      uploadThing: {
        secret: process.env.UPLOADTHING_SECRET,
        appId: process.env.UPLOADTHING_APP_ID,
      },
    },
  },

  // Collection Management
  collections: [
    // Boolean flags to disable defaults
    // { services: false, team: false },    // Disable multiple collections
    // Add custom collections
    // CustomProducts,                      // Your custom collection config
  ],

  // Global Configuration
  globals: [
    // { footer: false },                   // Disable footer global
    // CustomSettings,                      // Add custom globals
  ],

  // Block Configuration
  blocks: [
    // { form: false, "media-block": false }, // Disable default blocks
    // CustomBlock,                         // Add custom blocks
  ],

  // Raw Payload Configuration
  payload: {
    // Direct Payload config (advanced usage)
    // admin: { meta: { title: "Custom Admin" } },
    // plugins: [ customPlugin() ],
  },
})

export default smartSiteConfig
```

### 📋 Complete Settings Reference

#### Core Features

| Setting        | Type      | Default | Description                          |
| -------------- | --------- | ------- | ------------------------------------ |
| `gsap`         | `boolean` | `true`  | Enable GSAP animations and providers |
| `smoothScroll` | `boolean` | `true`  | Enable smooth scrolling behavior     |
| `themeToggle`  | `boolean` | `false` | Enable dark/light mode toggle        |
| `gsapDevTools` | `boolean` | `true`  | Show GSAP dev tools in development   |

#### Internationalization (i18n)

| Setting                    | Type                    | Default         | Description                                 |
| -------------------------- | ----------------------- | --------------- | ------------------------------------------- |
| `i18n`                     | `boolean \| i18nConfig` | `false`         | Simple enable/disable or full configuration |
| `i18n.prefixDefaultLocale` | `boolean`               | `false`         | Add locale prefix to default locale URLs    |
| `i18n.defaultLocale`       | `string`                | `"en"`          | Default site language                       |
| `i18n.locales`             | `string[]`              | `["en"]`        | Available languages                         |
| `i18n.localeCookie`        | `string`                | `"NEXT_LOCALE"` | Cookie name for locale preference           |

#### AI Integration

| Setting      | Type                  | Default                   | Description                                 |
| ------------ | --------------------- | ------------------------- | ------------------------------------------- |
| `ai`         | `boolean \| aiConfig` | `{ enabled: true }`       | Simple enable/disable or full configuration |
| `ai.enabled` | `boolean`             | `true`                    | Enable AI features in admin                 |
| `ai.url`     | `string`              | `"http://localhost:4112"` | AI backend service URL                      |

#### Content & SEO

| Setting           | Type      | Default | Description                 |
| ----------------- | --------- | ------- | --------------------------- |
| `search`          | `boolean` | `true`  | Enable search functionality |
| `analytics`       | `boolean` | `true`  | Enable analytics tracking   |
| `templateSupport` | `boolean` | `true`  | Enable page templates       |
| `sitemaps`        | `boolean` | `true`  | Generate XML sitemaps       |

#### Media Storage

| Setting                           | Type                                           | Default                             | Description             |
| --------------------------------- | ---------------------------------------------- | ----------------------------------- | ----------------------- |
| `media.storage`                   | `"local" \| "vercel" \| "s3" \| "uploadThing"` | `"local"`                           | Storage provider        |
| `media.vercel.token`              | `string`                                       | `process.env.BLOB_READ_WRITE_TOKEN` | Vercel blob token       |
| `media.vercel.cacheControlMaxAge` | `number`                                       | `31536000`                          | Cache duration (1 year) |
| `media.s3.bucket`                 | `string`                                       | -                                   | S3 bucket name          |
| `media.s3.region`                 | `string`                                       | -                                   | AWS region              |
| `media.s3.accessKeyId`            | `string`                                       | -                                   | AWS access key          |
| `media.s3.secretAccessKey`        | `string`                                       | -                                   | AWS secret key          |
| `media.s3.endpoint`               | `string`                                       | -                                   | Custom S3 endpoint      |
| `media.uploadThing.secret`        | `string`                                       | -                                   | UploadThing secret      |
| `media.uploadThing.appId`         | `string`                                       | -                                   | UploadThing app ID      |

#### Collection Management

Configure which default collections are enabled:

```typescript
collections: [
  { services: false, team: false }, // Disable specific collections
  CustomProducts, // Add custom collections
]
```

**Available Default Collections:**

- `pages` - Main page content
- `posts` - Blog/article content
- `services` - Service-specific pages
- `team` - Team member profiles
- `testimonials` - Customer testimonials
- `templates` - Reusable page templates
- `media` - File/image management
- `categories` - Content categorization
- `users` - Admin user management
- `uri-index` - URL routing management

#### Global Management

Configure global settings and navigation:

```typescript
globals: [
  { footer: false }, // Disable footer global
  CustomSettings, // Add custom globals
]
```

**Available Default Globals:**

- `header` - Site navigation and header
- `footer` - Footer content and links
- `settings` - Site-wide settings

#### Block Management

Configure available section blocks:

```typescript
blocks: [
  { form: false, "media-block": false }, // Disable specific blocks
  CustomBlock, // Add custom blocks
]
```

**Available Default Blocks:**

- `code` - Code syntax highlighting
- `form` - Contact/lead capture forms
- `media-block` - Rich media content blocks

### ⚠️ Admin Directory Warning

**DO NOT MODIFY ANYTHING IN `src/admin/`**:

- ❌ Don't edit `src/admin/payload/payload.config.ts`
- ❌ Don't modify collection configs directly
- ❌ Don't change admin utilities
- ✅ Instead, use the override system in `smartsite.config.ts`

The admin directory is designed to be **framework code** that remains untouched. All site-specific customizations flow through the `smartsite.config.ts` file using the boolean override system.

### Tailwind CSS v4 Configuration

Configuration is handled through CSS files in `src/app/(frontend)/css/`:

- **`globals.css`** - Entry point importing all styles
- **`theme.css`** - Design system tokens and brand colors
- **`base.css`** - Element-level base styles
- **`typography.css`** - Typography system and variables
- **`components.css`** - Complex reusable CSS classes
- **`utilities.css`** - Custom utility classes

### Payload CMS Configuration

Core CMS settings in `src/admin/payload/payload.config.ts`:

- **Collections**: Pages, Posts, Services, Team, Media, Forms
- **Globals**: Settings, Navigation, Footer
- **Plugins**: SEO, Redirects, Form Builder, Search
- **Admin**: Custom dashboard styling and user experience

## 🚀 Deployment

### Frontend Deployment (Vercel Recommended)

1. **Connect Repository**
   - Import smart-site project to Vercel
   - Configure build settings (auto-detected)

2. **Environment Variables**
   - Copy all variables from `.env.local`
   - Update `NEXT_PUBLIC_URL` to production domain
   - Set `VERCEL_PROJECT_PRODUCTION_URL`

3. **Database & Storage**
   - Configure Vercel Postgres in dashboard
   - Set up Vercel Blob for file storage
   - Copy connection strings to environment variables

4. **Advanced Settings**
   - Enable **Function Regions** (Sydney for AU/NZ projects)
   - Enable **Fluid Compute** for better performance
   - Consider **Standard CPU** for paid plans

### AI Backend Deployment

The Smart Site AI backend must be deployed separately:

1. **Deploy AI Backend**
   - Deploy `smart-site-ai` to Vercel, Railway, or other hosting
   - Set environment variables (`DATABASE_URL`, `OPENAI_API_KEY`)
   - Note the deployed URL

2. **Update Frontend Configuration**
   - Update `smartsite.config.ts` with production AI backend URL:

   ```typescript
   ai: {
     enabled: true,
     url: "https://your-ai-backend.vercel.app",
   }
   ```

3. **Security Considerations**
   - AI backend can be private/internal-only
   - Frontend communicates via HTTP API only
   - No AI secrets exposed to frontend

### Other Platforms

Smart Site can deploy to any Node.js hosting platform:

- **Netlify**: Use `@netlify/plugin-nextjs`
- **Railway**: Direct deployment with PostgreSQL addon
- **DigitalOcean**: App Platform with managed PostgreSQL
- **AWS**: Amplify with RDS or DocumentDB

### Production Checklist

#### Frontend (Smart Site)

- [ ] Environment variables configured
- [ ] Database provisioned and connected
- [ ] File storage configured
- [ ] Email service configured (Resend recommended)
- [ ] Domain configured with proper DNS
- [ ] SSL certificate enabled
- [ ] Admin user created
- [ ] **Content seeded or migrated**
- [ ] **Database seeding API endpoint secured for production**

#### AI Backend (Smart Site AI)

- [ ] AI backend deployed separately
- [ ] AI backend environment variables configured (`DATABASE_URL`, `OPENAI_API_KEY`)
- [ ] AI backend URL updated in frontend config
- [ ] AI backend health check accessible
- [ ] Frontend can successfully connect to AI backend

> **🚀 Production Seeding:** Remember to seed your production database after deployment using the same `/api/seed` endpoint or by running `pnpm seed` in your production environment.

---

## 📖 Additional Resources

- **[Payload CMS Documentation](https://payloadcms.com/docs)**
- **[Next.js 15 Documentation](https://nextjs.org/docs)**
- **[Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)**
- **[GSAP Documentation](https://greensock.com/docs/)**
- **[Mastra AI Documentation](https://mastra.ai/docs)**
- **[Smart Site AI Backend](../smart-site-ai/README.md)** - Separate AI backend documentation

## 🤝 Contributing

This is an internal tool for rapid website development. For questions or improvements, consult the development team.

## 📄 License

MIT License - See LICENSE file for details.
