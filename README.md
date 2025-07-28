# Smart Site - Modern Website Starter

A powerful website starter built with **Next.js 15+**, **Payload CMS**, **Tailwind CSS v4**, **GSAP**, and **Mastra AI**, designed for rapid development of section-based websites with enterprise-grade routing and caching.

## 📋 Table of Contents

- [Installation & Getting Started](#installation--getting-started)
- [Repository Overview](#repository-overview)
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
# Database Configuration
DATABASE_PROVIDER=postgres                           # "vercel" for PostgreSQL or "mongoose" for MongoDB
POSTGRES_URL=postgresql://username:password@host   # For PostgreSQL (get from Vercel Storage)
DATABASE_URI=mongodb://localhost:27017/smart-site  # For MongoDB (if using mongoose)

# Payload CMS Configuration
PAYLOAD_SECRET=your-unique-secret-key              # Generate at https://acte.ltd/utils/randomkeygen
PAYLOAD_CONFIG_PATH=./src/payload/payload.config.ts
PAYLOAD_ADMIN_EMAIL=admin@yourdomain.com           # For auto-login during development
PAYLOAD_ADMIN_PASSWORD=your-admin-password

# Preview & Draft Configuration
PREVIEW_SECRET=another-unique-secret-key           # For draft mode functionality

# GSAP Configuration
TOKEN=ee697198-7190-48fb-98df-b5aa34edf555       # Pre-configured token with full GSAP features

# Next.js Configuration
NEXT_PUBLIC_URL=http://localhost:3000              # Local development URL
VERCEL_PROJECT_PRODUCTION_URL=yourdomain.com       # Production URL for deployment

# File Storage (Vercel Blob recommended)
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token       # Get from Vercel Storage dashboard

# Email Service (Resend - optional for development)
RESEND_API_KEY=your-resend-api-key                 # Only needed for production email functionality

# AI Configuration (Mastra)
OPENAI_API_KEY=your-openai-api-key                 # For AI-powered features
```

### 3. Database Setup

#### Option A: Vercel PostgreSQL (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Storage** → **Create Database** → **Postgres**
3. Copy the `POSTGRES_URL` to your `.env.local`

#### Option B: MongoDB

1. Set up MongoDB (local or Atlas)
2. Set `DATABASE_PROVIDER=mongoose`
3. Add your `DATABASE_URI` to `.env.local`

### 4. Development Server

```bash
# Start development server (includes Mastra AI dev server)
pnpm dev

# Alternative: Start only Next.js server
pnpm dev:next

# Fresh development start (resets database and seeds data)
pnpm dev:fresh
```

### 5. Database Seeding & Initial Setup

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

### 6. Available Scripts

```bash
pnpm dev              # Start development with Next.js + Mastra AI
pnpm dev:next         # Start only Next.js development server
pnpm dev:mastra       # Start only Mastra AI development server
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

Smart Site uses a **section-first approach** to website building, where every page is composed of reusable section blocks managed through Payload CMS. This enables rapid development and content management flexibility.

> **🎯 Cursor AI Tip:** The cursor rule `smart-site/adding-new-sections` automates the entire section creation process - just tell your AI agent "create a new section" and it handles the rest!

### Key Technologies

- **Next.js 15+**: React framework with App Router
- **Payload CMS**: Headless CMS with block-based content management
- **Tailwind CSS v4**: Utility-first CSS framework with design system
- **GSAP**: Professional-grade animations
- **Mastra AI**: AI integration framework
- **TypeScript**: Type safety throughout the application

### Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (frontend)/              # Public-facing pages
│   │   ├── [[...slug]]/         # Dynamic routing for all pages
│   │   ├── css/                 # Tailwind configuration
│   │   └── api/                 # API routes
│   └── (payload)/               # Payload CMS admin
│       └── admin/               # Admin dashboard routes
├── components/                   # React components
│   ├── sections/                # CMS-powered section blocks
│   ├── layout/                  # Reusable layout components
│   ├── ui/                      # ShadCN UI components
│   └── icons/                   # Icon components
├── lib/                         # Server actions & business logic
│   ├── cache/                   # Intelligent caching system
│   ├── routing/                 # URI engine & routing logic
│   ├── data/                    # Data access layer
│   └── ai/                      # Mastra AI configuration
├── payload/                     # Payload CMS configuration
│   ├── collections/             # Content collections (Pages, Posts, etc.)
│   ├── fields/                  # Reusable field configurations
│   ├── components/              # Custom admin components
│   └── plugins/                 # CMS plugins
├── providers/                   # React context providers
├── utilities/                   # Shared utility functions
└── types/                       # TypeScript type definitions
```

> **🏗️ HTML Structure Tip:** Use the cursor rule `smart-site/html-structure` to understand how semantic HTML should be structured throughout the application.

## 🏗️ Building a Website

### Understanding the Section System

Smart Site is built around the concept of **sections** - reusable content blocks that can be combined to create pages. Each section consists of:

1. **Configuration** (`config.ts`) - Defines CMS fields and admin interface
2. **Component** (`Component.tsx`) - React component that renders the section

> **⚡ Quick Start:** Use the cursor rule `smart-site/adding-new-sections` - your AI agent will guide you through creating sections with proper patterns automatically!

### Creating a New Section

> **🤖 AI-Powered Section Creation:** Just tell your AI agent "create a new section called hero-banner" and the `smart-site/adding-new-sections` rule will handle the entire process including proper field configuration and component setup.

#### 1. Create Section Files

```bash
# Create new section directory
mkdir src/components/sections/hero-banner
```

Create two files:

**`src/components/sections/hero-banner/config.ts`**

```typescript
import type { Block } from "payload"
import { sectionIntro, sectionCta } from "@/payload/fields"

export const HeroBanner: Block = {
  slug: "hero-banner",
  admin: {
    group: "Hero Sections",
  },
  interfaceName: "HeroBannerBlock",
  fields: [
    sectionIntro({
      collapsibleLabel: "Hero Content",
      headingDescription: "Main hero heading",
    }),
    sectionCta({
      collapsibleLabel: "Call to Action",
    }),
    {
      name: "backgroundImage",
      type: "upload",
      relationTo: "media",
      required: false,
    },
  ],
}
```

> **⚙️ Field Configuration Tip:** Use the cursor rule `smart-site/payload-config` to understand how reusable field functions like `sectionIntro()` and `sectionCta()` map to React components.

**`src/components/sections/hero-banner/Component.tsx`**

```typescript
import { SectionIntro, SectionCta } from "@/components/layout"
import { Media } from "@/payload/components/frontend"
import type { HeroBannerBlock } from "@/payload/payload-types"

export const HeroBannerComponent: React.FC<HeroBannerBlock> = (props) => {
  const { sectionIntro, sectionCta, backgroundImage } = props

  return (
    <section className="relative min-h-screen flex items-center">
      {backgroundImage && (
        <div className="absolute inset-0 -z-10">
          <Media resource={backgroundImage} className="w-full h-full object-cover" />
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

> **🎨 Animation Tip:** Want to add GSAP animations? Use the cursor rule `smart-site/adding-animations` - your AI agent knows exactly how to implement animations following our standards.

#### 2. Register the Section

**Add to `src/components/sections/config.ts`:**

```typescript
import { HeroBanner } from "./hero-banner/config"

export const sectionsConfig = [
  // ... existing sections
  HeroBanner,
]
```

**Add to `src/components/sections/RenderSections.tsx`:**

```typescript
import { HeroBannerComponent } from "./hero-banner/Component"

const sectionComponents = {
  // ... existing components
  "hero-banner": HeroBannerComponent,
}
```

#### 3. Use in Pages

1. Go to `/admin` in your browser
2. Create or edit a page
3. Add your new "Hero Banner" section
4. Configure the content and save

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

### URI Index System

Every piece of content gets a unique URI stored in the **URI Index Collection**:

```
/                    → Homepage
/about               → About page
/services            → Services page
/services/consulting → Service detail page
/blog                → Blog archive
/blog/my-post        → Blog post
```

### Dynamic Route Resolution

The `[[...slug]]` catch-all route handles all requests:

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

## 📚 Lib Folder Structure

The `src/lib/` directory contains the core business logic organized by functionality:

### `/cache` - Intelligent Caching System

- **`cache.ts`** - Universal cache API with O(1) lookups
- **`revalidation.ts`** - Smart cache invalidation
- **`config.ts`** - Cache configuration and settings

```typescript
import { cache } from "@/lib/cache"

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

### `/ai` - Mastra AI Integration

- **`mastra.ts`** - AI service configuration
- **`agents/`** - AI agent definitions
- **`tools/`** - Custom AI tools

### `/sitemaps` - SEO & Discovery

- **`generate.ts`** - Dynamic sitemap generation
- **`config.ts`** - Sitemap configuration

### `/redirects` - URL Management

- **`legacy.ts`** - Legacy URL redirect mapping
- **`automatic.ts`** - System-generated redirects

### Server Actions Pattern

All lib modules export async functions marked with `"use server"`:

```typescript
// ✅ Correct: Server action file
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

Utilities should live in `/utilities` instead of `/lib`.

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

### Wild Child Config (`src/wc.config.ts`)

```typescript
const wildChildConfig = {
  themeToggle: false, // Enable dark/light mode toggle
  gsap: true, // Enable GSAP animations
  smoothScroll: true, // Enable smooth scrolling (requires GSAP)
  i18n: false, // Enable internationalization
  gsapDevTools: true, // Enable GSAP dev tools in development
}
```

### Tailwind CSS v4 Configuration

Configuration is handled through CSS files in `src/app/(frontend)/css/`:

- **`globals.css`** - Entry point importing all styles
- **`theme.css`** - Design system tokens and brand colors
- **`base.css`** - Element-level base styles
- **`typography.css`** - Typography system and variables
- **`components.css`** - Complex reusable CSS classes
- **`utilities.css`** - Custom utility classes

### Payload CMS Configuration

Core CMS settings in `src/payload/payload.config.ts`:

- **Collections**: Pages, Posts, Services, Team, Media, Forms
- **Globals**: Settings, Navigation, Footer
- **Plugins**: SEO, Redirects, Form Builder, Search
- **Admin**: Custom dashboard styling and user experience

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**
   - Import project to Vercel
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

### Other Platforms

Smart Site can deploy to any Node.js hosting platform:

- **Netlify**: Use `@netlify/plugin-nextjs`
- **Railway**: Direct deployment with PostgreSQL addon
- **DigitalOcean**: App Platform with managed PostgreSQL
- **AWS**: Amplify with RDS or DocumentDB

### Production Checklist

- [ ] Environment variables configured
- [ ] Database provisioned and connected
- [ ] File storage configured
- [ ] Email service configured (Resend recommended)
- [ ] Domain configured with proper DNS
- [ ] SSL certificate enabled
- [ ] Admin user created
- [ ] **Content seeded or migrated**
- [ ] **Database seeding API endpoint secured for production**

> **🚀 Production Seeding:** Remember to seed your production database after deployment using the same `/api/seed` endpoint or by running `pnpm seed` in your production environment.

---

## 📖 Additional Resources

- **[Payload CMS Documentation](https://payloadcms.com/docs)**
- **[Next.js 15 Documentation](https://nextjs.org/docs)**
- **[Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)**
- **[GSAP Documentation](https://greensock.com/docs/)**
- **[Mastra AI Documentation](https://mastra.ai/docs)**

## 🤝 Contributing

This is an internal tool for rapid website development. For questions or improvements, consult the development team.

## 📄 License

MIT License - See LICENSE file for details.
