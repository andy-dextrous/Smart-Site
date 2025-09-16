# Smart Site - Enterprise Website Builder

A **field-driven, section-first website builder** powered by **Next.js 15**, **Payload CMS 3**, **Tailwind CSS v4**, **GSAP**, and **AI integration via Mastra**, designed for rapid development of dynamic websites with enterprise-grade features.

## 📋 Table of Contents

- [Core Features](#core-features)
- [Installation & Getting Started](#installation--getting-started)
- [Architecture Overview](#architecture-overview)
- [Admin Layer System](#admin-layer-system)
- [AI Integration](#ai-integration)
- [Building Sections](#building-sections)
- [Routing & Caching](#routing--caching)
- [Configuration System](#configuration-system)
- [Extensions & Overrides](#extensions--overrides)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)
- [Deployment](#deployment)
- [Additional Resources](#additional-resources)
- [Contributing](#contributing)
- [License](#license)

<a id="core-features"></a>
## ⚡ Core Features

### Field-Driven Architecture

- **Reusable field patterns** - Pre-built field groups (`sectionIntro`, `sectionCta`, `button`, etc.)
- **Type-safe components** - Automatic TypeScript generation from Payload schemas
- **Visual field editor** - Admin UI adapts to your field configurations
- **Smart defaults** - Sensible field defaults for rapid development

### Section-First Development

- **20+ pre-built sections** - Hero, CTA, forms, grids, testimonials, and more
- **Component isolation** - Each section is self-contained with config + component
- **Drag-and-drop builder** - Arrange sections visually in Payload admin
- **Responsive by default** - All sections mobile-optimized with Tailwind v4

### Enterprise Features

- **O(1) URI resolution** - Instant page loading regardless of site size
- **Smart caching** - Intelligent cache invalidation and dependency tracking
- **SEO automation** - Meta tags, structured data, and sitemaps generated
- **Multi-language ready** - i18n support built into the architecture

### Admin/Frontend Separation

- **Protected admin layer** - Core CMS logic isolated from frontend code
- **Safe updates** - Admin updates won't break your customizations
- **Configuration-driven** - All customizations via `smartsite.config.ts`
- **Clean architecture** - Clear separation of concerns

### AI-Powered Features

- **Content assistant** - AI chat in admin panel for content creation
- **SEO suggestions** - Automated SEO improvements and scoring
- **Smart search** - AI-enhanced search functionality
- **Remote backend** - Secure AI processing via Mastra framework

<a id="installation--getting-started"></a>
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

# Copy environment file (or run \`pnpm run setup\` for the interactive flow)
cp .env.example .env
```

### 2. Environment Configuration

> 💡 **Quick start**: `pnpm run setup` walks you through port, database, storage, admin credentials, and seeds demo content automatically. It updates `.env`, starts the dev server, and leaves it running when finished.

Configure your `.env` file with these required variables:

```bash
# Core Configuration
NODE_ENV=development
NEXT_PUBLIC_URL=http://localhost:3000
PAYLOAD_CONFIG_PATH=./src/admin/payload/payload.config.ts

# Database (Choose MongoDB or PostgreSQL)
DATABASE_PROVIDER=mongoose                         # or "postgres"
DATABASE_URL=mongodb://localhost:27017/smart-site  # or PostgreSQL URL

# Security
PAYLOAD_SECRET=<generate-random-32-char-string>    # openssl rand -hex 32
PREVIEW_SECRET=<generate-random-16-char-string>    # openssl rand -hex 16

# Storage (Optional - defaults to local)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...          # Vercel Blob storage
# S3_ACCESS_KEY=...                               # AWS S3 (future)
# CLOUDINARY_URL=...                              # Cloudinary (future)

# Email (Optional - for forms)
RESEND_API_KEY=re_...                             # Resend.com API key
RESEND_DEFAULT_FROM=noreply@example.com

# AI Backend (Optional)
NEXT_PUBLIC_AI_URL=http://localhost:4112          # Smart Site AI URL
# OPENAI_API_KEY=sk-...                           # If using AI features

# Admin Seeding (Development)
PAYLOAD_ADMIN_EMAIL=admin@example.com
PAYLOAD_ADMIN_PASSWORD=SecurePassword123!
```

### 3. Database Setup

#### Option A: MongoDB (Recommended)

**Cloud MongoDB (MongoDB Atlas)**

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster and database
3. Get connection string from Atlas dashboard
4. Set `DATABASE_PROVIDER=mongoose`
5. Add your `DATABASE_URL` to `.env`

**Local MongoDB Development**

**Initial Setup:**

1. Install MongoDB locally:

   **macOS:**

   ```bash
   # Using Homebrew (recommended)
   brew tap mongodb/brew
   brew install mongodb-community
   brew services start mongodb/brew/mongodb-community
   ```

   **Windows:**

   ```powershell
   # Using Chocolatey (recommended)
   choco install mongodb

   # Or using winget
   winget install MongoDB.Server

   # Or download installer from https://www.mongodb.com/try/download/community
   # Follow the installation wizard and select "Install MongoDB as a Service"
   ```

   **Manual Download (both platforms):**
   - Visit https://www.mongodb.com/try/download/community
   - Choose your OS and follow installation instructions

2. Install MongoDB Shell for database interaction:

   **macOS:**

   ```bash
   brew install mongodb/brew/mongodb-community-shell
   ```

   **Windows:**

   ```powershell
   # Using Chocolatey
   choco install mongodb-shell

   # Or download from https://www.mongodb.com/try/download/shell
   ```

3. Configure environment:
   ```bash
   DATABASE_PROVIDER=mongoose
   DATABASE_URL=mongodb://localhost:27017/smart-site-dev
   ```

**Understanding Your Local MongoDB:**

- **Location**: Your MongoDB data lives in `~/mongodb/data/`
- **Status**: MongoDB runs as a background daemon (survives terminal closes/computer sleep)
- **Port**: Default port 27017
- **Multiple projects**: Same MongoDB server, different database names

**Daily Development Workflow:**

**Direct shell commands:**

**macOS/Linux:**

```bash
# 4. View databases via shell
mongo --eval "db.adminCommand('listDatabases')"

# 5. View collections in your project
mongo smart-site-dev --eval "db.getCollectionNames()"
```

**Windows:**

```powershell
# 4. View databases via shell
mongo --eval "db.adminCommand('listDatabases')"

# 5. View collections in your project
mongo smart-site-dev --eval "db.getCollectionNames()"

# Alternative: Start MongoDB service manually if needed
net start MongoDB

# Stop MongoDB service
net stop MongoDB
```

**GUI Access (Recommended):**

- **MongoDB Compass**: Download from https://www.mongodb.com/products/compass
- **Connection**: `mongodb://localhost:27017`
- **Benefits**: Visual database browser, query builder, real-time monitoring

**Multiple Project Setup:**

```bash
# Each project uses different database name:
# Project 1: DATABASE_URL=mongodb://localhost:27017/smart-site-dev
# Project 2: DATABASE_URL=mongodb://localhost:27017/smart-site-client2
# Project 3: DATABASE_URL=mongodb://localhost:27017/smart-site-ecommerce
```

**Create new database for second project (all platforms):**

**Interactive shell:**

```bash
mongo
> use smart-site-client2
> db.setup.insertOne({project: "client2", created: new Date()})
> exit
```

**One-liner (macOS/Linux):**

```bash
mongo smart-site-client2 --eval 'db.setup.insertOne({project: "client2", created: new Date()})'
```

**One-liner (Windows):**

```powershell
mongo smart-site-client2 --eval "db.setup.insertOne({project: 'client2', created: new Date()})"
```

**Important Notes:**

- MongoDB creates databases lazily (only after inserting data)
- GUI clients like Compass **cannot** start MongoDB - server must be running first
- MongoDB shell connection fails if the server is stopped—start the service before running shell commands
- One MongoDB server can host multiple project databases

#### Option B: Vercel PostgreSQL

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Storage** → **Create Database** → **Postgres**
3. Copy the `POSTGRES_URL` to your `.env`

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
PAYLOAD_CONFIG_PATH=src/admin/payload/payload.config.ts payload  # Access Payload CLI
pnpm generate:types   # Generate TypeScript types from Payload
```

<a id="architecture-overview"></a>
## 🏗 Architecture Overview

### Design Philosophy

Smart Site follows a **field-driven, section-first architecture** where:

- **Fields drive everything** - CMS fields automatically generate admin UI and component props
- **Sections are self-contained** - Each section has its own config and component
- **Admin layer is protected** - Core CMS logic is isolated from frontend customizations
- **Configuration over modification** - All customizations via `smartsite.config.ts`

### Technology Stack

| Layer         | Technology            | Purpose                                |
| ------------- | --------------------- | -------------------------------------- |
| **Framework** | Next.js 15 App Router | React framework with server components |
| **CMS**       | Payload CMS 3         | Headless CMS with visual editor        |
| **Styling**   | Tailwind CSS v4       | Utility-first CSS with design tokens   |
| **Animation** | GSAP + ScrollTrigger  | Professional animations                |
| **AI**        | Mastra Framework      | Remote AI backend integration          |
| **Database**  | MongoDB/PostgreSQL    | Content storage                        |
| **Storage**   | Vercel Blob/S3        | Media file storage                     |
| **Language**  | TypeScript            | Type safety throughout                 |

### Directory Structure

```
apps/smart-site/
├── src/
│   ├── app/                              # Next.js App Router
│   │   ├── (frontend)/                   # 🌐 Public website routes
│   │   │   ├── [[...uri]]/               # Dynamic catch-all routing
│   │   │   │   └── page.tsx               # Main page renderer
│   │   │   ├── api/                      # Frontend API endpoints
│   │   │   │   ├── ai/                   # AI chat endpoint
│   │   │   │   ├── preview/              # Preview mode
│   │   │   │   └── seed/                 # Database seeding
│   │   │   └── css/                      # Tailwind v4 styles
│   │   │       ├── globals.css           # Main entry point
│   │   │       ├── theme.css             # Design tokens
│   │   │       └── typography.css        # Typography system
│   │   └── (payload)/                    # 🔐 Admin panel routes
│   │       ├── admin/                    # Payload admin UI
│   │       └── api/                      # CMS API endpoints
│   │
│   ├── components/                       # 🎨 Frontend components
│   │   ├── sections/                     # 📦 Content sections (main dev area)
│   │   │   ├── config.ts                 # Section registry
│   │   │   ├── sections-map.tsx          # Component mapping
│   │   │   ├── CLAUDE.md                 # Section dev guide
│   │   │   └── [section-name]/           # Individual sections
│   │   │       ├── config.ts             # Payload fields
│   │   │       └── Component.tsx         # React component
│   │   ├── blocks/                       # Reusable content blocks
│   │   │   ├── form/                     # Form builder blocks
│   │   │   ├── media/                    # Media blocks
│   │   │   └── code/                     # Code blocks
│   │   ├── fields/                       # Field components
│   │   ├── layout/                       # Layout components
│   │   │   ├── section-intro.tsx         # Heading + description
│   │   │   ├── section-cta.tsx           # Call-to-action
│   │   │   └── button.tsx                # Button component
│   │   ├── ui/                           # Base UI components
│   │   ├── header/                       # Site header
│   │   ├── footer/                       # Site footer
│   │   └── posts/                        # Blog components
│   │
│   ├── admin/                            # ⚠️ PROTECTED ADMIN LAYER
│   │   ├── config/                       # Configuration system
│   │   │   ├── index.ts                  # Config loader
│   │   │   ├── defaults.ts               # Default settings
│   │   │   ├── resolver.ts               # Config resolver
│   │   │   └── frontend.ts               # Frontend config
│   │   ├── payload/                      # Payload CMS core
│   │   │   ├── payload.config.ts         # Main config
│   │   │   ├── collections/              # Content types
│   │   │   │   ├── pages.ts              # Page collection
│   │   │   │   ├── posts.ts              # Blog posts
│   │   │   │   ├── media.ts              # Media library
│   │   │   │   └── uri-index.ts          # URI routing
│   │   │   ├── globals/                  # Global configs
│   │   │   ├── fields/                   # Field patterns
│   │   │   ├── blocks/                   # Admin blocks
│   │   │   ├── hooks/                    # Lifecycle hooks
│   │   │   └── components/               # Admin components
│   │   ├── cache/                        # Caching system
│   │   ├── routing/                      # URI engine
│   │   ├── data/                         # Data access
│   │   ├── ai/                           # AI integration
│   │   └── utilities/                    # Admin utilities
│   │
│   ├── extensions/                       # User extensions
│   │   ├── blocks/                       # Custom blocks
│   │   ├── components/                   # Custom components
│   │   └── globals/                      # Custom globals
│   │
│   ├── providers/                        # React providers
│   │   └── gsap/                         # GSAP setup
│   │
│   ├── utilities/                        # Frontend utilities
│   ├── types/                            # TypeScript types
│   └── smartsite.config.ts               # 🎯 USER CONFIG
│
├── public/                               # Static assets
├── package.json                          # Dependencies
└── next.config.ts                        # Next.js config
```

### Layer Separation

| Layer          | Location                                 | Purpose              | Modify?            |
| -------------- | ---------------------------------------- | -------------------- | ------------------ |
| **Frontend**   | `src/components/`, `src/app/(frontend)/` | Public website       | ✅ Yes             |
| **Admin**      | `src/admin/`                             | CMS core system      | ❌ No (use config) |
| **Extensions** | `src/extensions/`                        | User customizations  | ✅ Yes             |
| **Config**     | `src/smartsite.config.ts`                | System configuration | ✅ Yes             |

<a id="admin-layer-system"></a>
## 🔒 Admin Layer System

The `src/admin/` directory contains the **core system** that powers Smart Site. In the master development environment, this layer is actively developed and maintained.

### Key Characteristics

- **🚀 Active development** - New features are built here in master
- **📦 Self-contained manifest** - Has its own package.json for dependency management
- **🔄 Source of updates** - Changes here flow to starter and client sites
- **🎯 Configuration-driven** - Provides config system for customization
- **🏗 Complete backend** - Contains all CMS, routing, and caching logic

### What's Inside Admin

| Directory      | Purpose                | Key Files                                   |
| -------------- | ---------------------- | ------------------------------------------- |
| `config/`      | Configuration system   | `defaults.ts`, `resolver.ts`, `frontend.ts` |
| `payload/`     | Payload CMS setup      | `payload.config.ts`, collections, globals   |
| `cache/`       | Caching & revalidation | O(1) lookups, smart invalidation            |
| `routing/`     | URI engine             | Route resolution, dependency tracking       |
| `data/`        | Data access layer      | Posts, drafts, user management              |
| `ai/`          | AI integration         | Mastra client configuration                 |
| `utilities/`   | Helper functions       | SEO, formatting, validation                 |
| `package.json` | Dependency manifest    | Version tracking, shared dependencies       |

### Admin Package.json Manifest

The admin layer includes its own `package.json` at `src/admin/package.json` which serves as a **dependency manifest**:

```json
{
  "name": "@smartsite/admin-layer",
  "version": "1.1.1",
  "sharedDependencies": {
    // Dependencies that admin needs in the main package.json
    "@payloadcms/next": "latest"
    // ... other required packages
  },
  "peerDependencies": {
    // Framework versions required
    "next": "^15.5.2",
    "payload": "latest"
  },
  "adminMetadata": {
    // Admin layer requirements
  }
}
```

**Key Features:**

- **Version tracking** - Identifies admin layer version for releases
- **Shared dependencies** - Packages needed by both admin and frontend
- **Peer dependencies** - Framework version requirements
- **Auto-sync** - CLI automatically syncs dependencies during updates

**How It Works:**

1. Admin declares its package requirements in `sharedDependencies`
2. During updates, the CLI reads this manifest
3. Required packages are automatically added to client's main `package.json`
4. Framework compatibility is checked via `peerDependencies`
5. Client runs `pnpm install` once to get all new packages

This ensures client sites always have the packages the admin layer needs without manual dependency management.

### ⚠️ IMPORTANT: Updating Admin Package.json

**When making changes to the admin layer, you MUST update `src/admin/package.json`:**

```bash
# Before making admin changes:
1. Edit src/admin/package.json
2. Increment version (e.g., 1.1.1 → 1.1.2)
3. Update releaseDate
4. Add any new packages to sharedDependencies
5. Make your admin changes
6. Run: pnpm sync:to-starter
```

Example:

```json
{
  "version": "1.1.2", // ← ALWAYS INCREMENT THIS
  "releaseDate": "2025-01-05", // ← UPDATE DATE
  "sharedDependencies": {
    // Add any new packages the admin needs:
    "@new-package": "^1.0.0"
  }
}
```

**This is CRITICAL because:**

- The version identifies each admin release
- The CLI uses this for compatibility checks
- sharedDependencies ensures client sites get required packages
- GitHub workflows read the version for releases

### How Updates Flow to Client Sites

1. **Development** - New features built in this master environment
2. **Version bump** - Update version in `src/admin/package.json`
3. **Test** - Features tested with demo data
4. **Sync** - Admin folder synced to smart-site-starter: `pnpm sync:to-starter`
5. **Release** - Tagged release created with version from admin package.json
6. **Update** - Client sites pull updates via SmartSite CLI
7. **Dependencies** - CLI auto-syncs required packages from manifest
8. **Install** - Clients run `pnpm install` to get new packages

<a id="ai-integration"></a>
## 🤖 AI Integration

Smart Site includes powerful AI features via the **Mastra framework**, with processing handled by a remote backend for security and scalability.

### Architecture

```
┌─────────────────┐     HTTP API     ┌─────────────────┐
│   Smart Site    │ ◄──────────────► │ Smart Site AI   │
│   (Frontend)    │                  │   (Backend)     │
│                 │                  │                 │
│ • Next.js       │                  │ • Mastra Core   │
│ • Payload CMS   │                  │ • AI Agents     │
│ • Assistant UI  │                  │ • Workflows     │
│ • Admin Chat    │                  │ • Vector Store  │
└─────────────────┘                  └─────────────────┘
```

### Features

- **Admin Chat Assistant** - AI-powered chat panel in admin interface
- **Content Generation** - Generate SEO-optimized content
- **Smart Search** - AI-enhanced content discovery
- **SEO Scoring** - Real-time SEO analysis and suggestions
- **Content Analysis** - Readability and quality checks

### Configuration

Configure AI in `src/smartsite.config.ts`:

```typescript
const config: UserConfig = {
  frontend: {
    ai: {
      enabled: true,
      url: process.env.NEXT_PUBLIC_AI_URL || "http://localhost:4112",
    },
  },
}
```

### Backend Setup

The AI backend (`apps/smart-site-ai`) runs separately:

```bash
# Development
cd apps/smart-site-ai
pnpm dev  # Runs on port 4112

# Production - Deploy to Vercel/Railway
# Update NEXT_PUBLIC_AI_URL in frontend
```

### AI Backend Authentication System

Smart Site authenticates with the AI backend using a special "AI Agent" user pattern:

#### How Authentication Works

1. **AI Agent User**: Each Smart Site instance has a hidden user with role `ai-agent`
2. **API Key Generation**: This user has an API key (64-character hex string) for authentication
3. **Auto-Creation**: The AI agent is automatically created during database seeding
4. **Environment Storage**: Credentials are saved to `.env`:

```bash
# AI Agent Configuration (Auto-generated)
AI_AGENT_API_KEY=80fda7460be5a83e4dc8256392bba4baacdd48777fd5eb1bdd13a1c1b9a25375
AI_AGENT_USER_ID=68c0ba9971ba48af9e63f160
```

#### Setting Up AI Authentication

1. **Run Database Seeding**:

```bash
pnpm seed
# OR
curl -X POST http://localhost:3000/api/seed
```

2. **Look for API Key Output**:

```
═══════════════════════════════════════════════════════════════
AI AGENT API KEY (SAVE THIS - SHOWN ONLY ONCE):
API Key: [64-character hex string]
Email: ai@smartsite.local
User ID: [user-id]
═══════════════════════════════════════════════════════════════
```

3. **Verify Environment Variables**: Check that `.env` contains the auto-generated credentials (the seed script keeps `.env` in sync—rerun it if values go missing)

#### API Authentication Flow

```typescript
// Smart Site makes authenticated requests to AI backend
const response = await fetch(`${AI_BACKEND_URL}/api/operations`, {
  headers: {
    Authorization: `Bearer ${AI_AGENT_API_KEY}`,
    "X-Site-ID": AI_AGENT_USER_ID,
    "X-Site-URL": NEXT_PUBLIC_URL,
  },
})
```

#### End-to-End Request Flow

1. Frontend API routes under `app/(frontend)/api/ai/*` validate the shared secret, add the `X-Site-ID` header, and proxy requests to the Mastra backend.
2. The backend (see `apps/smart-site-ai/README.md`) verifies the site ID/API key pair, loads the correct workspace, and runs the requested chat/thread/schema operation.
3. Responses stream back through the proxy so the admin chat panel and public endpoints never expose Mastra credentials directly.
4. `ensureAIAgentWithAPIKey` keeps the Payload AI agent user and `.env` credentials synchronized during seeding, preserving a single Smart Site identity.

> For backend installation and environment setup, follow `apps/smart-site-ai/README.md`. Once the service is running, point `NEXT_PUBLIC_AI_URL` to that endpoint and the proxy routes above will take care of authentication.

#### Security Features

- **Hidden User**: AI agent never appears in admin UI
- **Encrypted Storage**: API keys are encrypted in database using `PAYLOAD_SECRET`
- **One-Time Display**: API key shown only during creation
- **Role Isolation**: `ai-agent` role has specific access patterns
- **Multi-Tenant Ready**: Each site has unique credentials

### Planned AI Endpoints

The following endpoints will be implemented to connect Smart Site with the AI backend:

#### `/api/ai-config`

- Exposes block schemas and field configurations
- Bypasses GraphQL introspection limitations
- Returns sanitized Payload configuration
- Cached with ETag headers

#### `/api/ai/auth`

- Edge function for fast API key validation
- Returns site metadata and permissions
- Never trusts client-provided URLs

#### `/api/ai/operations`

- Proxies AI operations to backend
- Re-validates API key for security
- Streams responses back to frontend

<a id="building-sections"></a>
## 📦 Building Sections

Sections are the **core building blocks** of Smart Site. Each section is a self-contained unit with its own fields and component.

### Section Architecture

Every section consists of two required files:

| File            | Purpose                   | Location                        |
| --------------- | ------------------------- | ------------------------------- |
| `config.ts`     | Payload fields definition | `sections/[name]/config.ts`     |
| `Component.tsx` | React component           | `sections/[name]/Component.tsx` |

### Quick Start

```bash
# 1. Create section folder (kebab-case)
mkdir src/components/sections/hero-banner

# 2. Create config.ts and Component.tsx
touch src/components/sections/hero-banner/{config.ts,Component.tsx}
```

### Step 1: Define Fields (config.ts)

```typescript
import type { Block } from "payload"
import { sectionIntro, sectionCta } from "@/components/fields"

export const HeroBanner: Block = {
  slug: "hero-banner",
  interfaceName: "HeroBannerBlock",
  fields: [
    sectionIntro(), // Reusable field group
    sectionCta(), // Call-to-action fields
    {
      name: "backgroundImage",
      type: "upload",
      relationTo: "media",
    },
  ],
}
```

### Step 2: Build Component (Component.tsx)

```typescript
import { SectionIntro, SectionCta } from "@/components/layout"
import { Media } from "@/admin/payload/components/frontend/media"
import type { HeroBannerBlock } from "@/admin/payload/payload-types"

export function HeroBannerComponent({
  sectionIntro,
  sectionCta,
  backgroundImage
}: HeroBannerBlock) {
  return (
    <section className="relative min-h-screen">
      {backgroundImage && <Media resource={backgroundImage} />}
      <SectionIntro {...sectionIntro} />
      <SectionCta {...sectionCta} />
    </section>
  )
}
```

### Step 3: Register Section

```typescript
// src/components/sections/config.ts
export { HeroBanner } from "./hero-banner/config"

// src/components/sections/sections-map.tsx
import { HeroBannerComponent } from "./hero-banner/Component"
export const sectionsMap = {
  "hero-banner": HeroBannerComponent,
}
```

### Design Tokens & Styling

- **Spacing** (`theme.css`): use classes like `px-section-x`, `py-section-y`, `gap-content`, `gap-content-sm/lg`, and the container utilities (`container`, `container-md`, `container-sm`) to align with the layout grid.
- **Color tokens**: prefer palette utilities such as `bg-primary-500`, `text-secondary-600`, `text-dark-700`, `border-light-border`. Gradient helpers (e.g., `.gradient-border`) live in `components.css`.
- **Utilities** (`utilities.css`): helpers like `stop-scroll`, `scrollbar-hidden`, `center`, `fill-abs`, and `title-hidden` handle cross-component behaviors.
- **Animations**: mark animated components with `"use client"`, import `useGSAP`/`gsap` from `@/providers/gsap`, scope the animation with a ref, animate transforms/opacity, and add `will-change` classes when animating.
- **Typography & padding**: lean on the design system for spacing (`px-section-x`, `py-section-y`, `gap-content`) and type instead of adding ad-hoc `p-*`, `text-*`, or `leading-*` utilities inside components.
- **Styling workflow**: check `components.css` for reusable patterns before layering custom Tailwind values; only add new classes there when the pattern will be reused.

### Reusable Field Patterns

Smart Site provides **pre-built field groups** that ensure consistency:

| Field Group          | Purpose          | Includes                        |
| -------------------- | ---------------- | ------------------------------- |
| `sectionIntro()`     | Section header   | Heading, description, alignment |
| `sectionCta()`       | Call-to-action   | Button text, link, style        |
| `button()`           | Single button    | Label, URL, variant             |
| `buttonsGroup()`     | Multiple buttons | Array of buttons                |
| `link()`             | Smart linking    | Internal/external/anchor        |
| `mediaWithOptions()` | Enhanced media   | Image + alt text + caption      |

### Section Best Practices

✅ **DO:**

- Use kebab-case folder names (`hero-banner`)
- Leverage reusable field patterns
- Keep sections generic and reusable
- Use architectural names (`card-grid`, `text-image`)

❌ **DON'T:**

- Create page-specific sections (`about-hero`)
- Hardcode content in components
- Mix admin and frontend imports
- Skip type safety

<a id="routing--caching"></a>
## ⚡ Routing & Caching

### O(1) URI Resolution

Smart Site uses a **URI Index** for instant page resolution:

```
Database Query Performance:
Traditional CMS: /blog/2024/my-post → 3-4 queries (hierarchy traversal)
Smart Site: /blog/2024/my-post → 1 query (direct index lookup)
```

### How It Works

1. **URI Index Collection** - Pre-computed URI → Document mapping
2. **Single Query** - Any URL resolves in one database hit
3. **Automatic Updates** - URIs regenerate when content changes
4. **Smart Redirects** - 301s created when URLs change

### Route Examples

```
/                    → Homepage (page:home)
/about               → Page (page:about)
/services            → Archive (page:services + children)
/services/web-dev    → Service (service:web-dev)
/blog                → Archive (page:blog + posts)
/blog/my-post        → Post (post:my-post)
```

### Caching Strategy

| Cache Type   | Duration            | Invalidation    |
| ------------ | ------------------- | --------------- |
| **Pages**    | Until edited        | On save         |
| **Archives** | Until child changes | On child update |
| **Media**    | 1 year              | On replacement  |
| **API**      | 60 seconds          | Time-based      |

### Static Generation

```typescript
// Next.js static params generation
export async function generateStaticParams() {
  const uris = await cache.getAllURIs()
  return uris.map(uri => ({
    slug: uri.split("/").filter(Boolean),
  }))
}
```

<a id="configuration-system"></a>
## ⚙️ Configuration System

Smart Site uses a **comprehensive configuration system** via `src/smartsite.config.ts` that controls all aspects without modifying core files.

### Configuration Structure

```typescript
import type { UserConfig } from "@/admin/config/defaults"

const config: UserConfig = {
  // Collections configuration
  collections: {
    pages: { enabled: true, frontend: true },
    posts: { enabled: true, frontend: true },
    services: { enabled: false }, // Disable unwanted
    // ... configure each collection
  },

  // Feature flags
  features: {
    ai: { enabled: true, endpoint: "http://localhost:4112" },
    darkMode: false,
    i18n: false,
    analytics: true,
    search: true,
    sitemaps: true,
  },

  // Admin configuration
  admin: {
    theme: {
      colors: { accent: "#4f37fb" },
      layout: { sidebarWidth: "240px" },
    },
    meta: {
      title: "Admin | Smart Site",
      description: "Advanced admin panel",
      favicon: "/favicon.png",
    },
  },

  // Image optimization
  images: {
    quality: {
      default: 85,
      thumbnail: 75,
      hero: 90,
    },
    sizes: [
      { name: "thumbnail", width: 300 },
      { name: "medium", width: 900 },
      { name: "large", width: 1400 },
    ],
    breakpoints: {
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
    },
  },

  // GSAP configuration
  gsap: {
    scrollTrigger: true,
    scrollSmoother: true,
    // ... other GSAP plugins
  },

  // Extensions
  extensions: {
    collections: [], // Custom collections
    blocks: [], // Custom blocks
    globals: [], // Custom globals
    plugins: [], // Payload plugins
  },
}

export default config
```

### Default collections and extensions

Smart Site ships with a full set of first-party collections that already cover typical marketing needs. The defaults live in `apps/smart-site/src/admin/config/defaults.ts` (`SMARTSITE_DEFAULTS`) and every collection defined there starts with `enabled: true`. That means services, team, testimonials, templates, media, categories, pages, and posts are available the moment the app boots—you only need to touch `smartsite.config.ts` if you want to rename them, change SEO/front-end behaviour, or explicitly disable something.

- **System collections** (`uri-index`, `users`, `templates`) are always registered by the resolver in `src/admin/config/resolver.ts`, even if you try to disable them. They keep routing, authentication, and layout scaffolding intact.
- **Content collections** (`pages`, `posts`, `services`, `team`, `testimonials`, `categories`, `media`) stay on by default. Set `enabled: false` in `smartsite.config.ts` to hide one.
- **Extensions** are only for new slugs that do not exist in the default registry. Declare the slug in `smartsite.config.ts → extensions` and provide the actual config in `src/extensions`. Do **not** add built-in collections such as `services` or `testimonials` to extensions—they already exist.
- **Plugin collections** (`forms`, `form-submissions`, `redirects`, `search`, etc.) are installed automatically by the default plugin stack in `src/admin/payload/plugins`. They will appear in `payload-types.ts` without any manual configuration.

### Inspecting the active Payload configuration

1. Open `apps/smart-site/src/admin/config/defaults.ts` to see every baseline setting, including the default labels, SEO flags, sitemap weights, and feature toggles.
2. Review `apps/smart-site/src/smartsite.config.ts` for project-specific overrides—the file is merged deeply, so any key you omit uses the default above.
3. Check `apps/smart-site/src/extensions/index.ts` (and the folders it imports) to find custom collections/globals/blocks that replace or extend the defaults. The resolver automatically swaps them in when the slug matches.
4. Confirm the final build output in `apps/smart-site/src/admin/payload/payload-types.ts`. Payload regenerates this file on build and it lists every collection/global/block that is actually registered.

### Complete Configuration Options

#### Collections Configuration

| Collection       | Default state        | Frontend default | Purpose                       |
| ---------------- | -------------------- | ---------------- | ----------------------------- |
| `pages`          | Enabled              | Yes              | Primary marketing pages       |
| `posts`          | Enabled              | Yes              | Blog articles                 |
| `services`       | Enabled              | Yes              | Service or offering pages     |
| `team`           | Enabled              | Yes              | Team member bios              |
| `testimonials`   | Enabled              | No               | Social proof library          |
| `categories`     | Enabled              | No               | Content categorization        |
| `media`          | Enabled (`local`)    | No               | Asset storage + adapters      |
| `templates`*     | Enabled (system)     | No               | Page blueprint library        |
| `users`*         | Enabled (system)     | No               | Admin authentication          |
| `uri-index`*     | Always included      | N/A              | Global URI → document index   |

`*` System collections cannot be removed; Smart Site requires them for routing and admin access.

Each configurable collection (any slug inside `smartsite.config.ts → collections`) supports:

- `enabled`: Turn on/off
- `frontend`: Enable frontend features (SEO, preview)
- `seo`: Add SEO fields
- `frontendOptions.seoSchemaType`: Schema.org type
- `sitemap`: Include in sitemap

#### Feature Flags

| Feature       | Options   | Default          | Purpose                                                                         |
| ------------- | --------- | ---------------- | ------------------------------------------------------------------------------- |
| `ai.enabled`  | `boolean` | `true`           | Enable/disable entire AI layer including chat panel, hotkeys, and Mastra client |
| `ai.endpoint` | `string`  | `localhost:4112` | AI backend URL (only used when ai.enabled is true)                              |
| `darkMode`    | `boolean` | `false`          | Dark/light theme toggle                                                         |
| `i18n`        | `boolean` | `false`          | Internationalization                                                            |
| `analytics`   | `boolean` | `true`           | Analytics tracking                                                              |
| `search`      | `boolean` | `true`           | Search functionality                                                            |
| `sitemaps`    | `boolean` | `true`           | XML sitemap generation                                                          |

**AI Configuration Details:**

When `ai.enabled` is set to `false`:

- No connection to the AI backend is attempted
- Chat panel UI is completely removed from the DOM
- Keyboard shortcuts (Cmd+L) are disabled
- No AI-related API calls or network requests are made
- Zero performance impact from AI features

```typescript
// Disable AI completely
features: {
  ai: {
    enabled: false  // Bypasses entire AI layer
  }
}

// Enable AI with custom backend
features: {
  ai: {
    enabled: true,
    endpoint: "https://your-ai-backend.vercel.app"
  }
}
```

#### GSAP Plugins

| Plugin           | Default | Purpose                 |
| ---------------- | ------- | ----------------------- |
| `scrollTrigger`  | `true`  | Scroll-based animations |
| `scrollSmoother` | `true`  | Smooth scrolling        |
| `flip`           | `false` | State transitions       |
| `draggable`      | `false` | Drag interactions       |
| `morphSVG`       | `false` | SVG morphing            |
| `splitText`      | `false` | Text animations         |

#### Admin Configuration

Customize the admin panel appearance and metadata:

```typescript
admin: {
  // Visual theme
  theme: {
    colors: {
      accent: "#4f37fb",        // Primary brand color
      error: "#dc2626",          // Error states
      success: "#16a34a",        // Success states
      grayscale: { /* 0-1000 scale */ }
    },
    layout: {
      sidebarWidth: "240px",
      headerHeight: "60px",
      borderRadius: "0.375rem",
    },
    typography: {
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: "14px",
    },
  },

  // Page metadata
  meta: {
    title: "Admin | Smart Site",        // Browser title
    description: "Admin panel",         // Meta description
    favicon: "/favicon.png",            // Optional favicon path
  },
}
```

#### Image Optimization

Control image quality, sizes, and responsive behavior:

```typescript
images: {
  // Quality settings by context
  quality: {
    default: 85,         // Default quality (1-100)
    thumbnail: 75,       // Lower for thumbnails
    hero: 90,           // Higher for hero images
  },

  // Image size variations generated by Payload
  sizes: [
    { name: "thumbnail", width: 300 },
    { name: "square", width: 500, height: 500 },
    { name: "small", width: 600 },
    { name: "medium", width: 900 },
    { name: "large", width: 1400 },
    { name: "xlarge", width: 1920 },
    { name: "og", width: 1200, height: 630, crop: "center" },
  ],

  // Responsive breakpoints for srcSet calculation
  breakpoints: {
    "3xl": 1920,
    "2xl": 1536,
    "xl": 1280,
    "lg": 1024,
    "md": 768,
    "sm": 640,
  },
}
```

**Override at Component Level:**

```tsx
// Use default quality (85)
<Media resource={image} alt="Product" />

// Override quality for this image
<Media resource={image} alt="Hero" quality={95} />

// Override breakpoints
<Media resource={image} breakpoints={{ mobile: 480, tablet: 768 }} />
```

#### Breadcrumb Configuration

Control breadcrumb display, labels, and behavior:

```typescript
breadcrumbs: {
  enabled: true,                  // Enable/disable globally
  homeLabel: "Home",              // Customize home link text
  separator: "slash",             // Options: "slash", "chevron", "arrow", "dot"
  maxDepth: 0,                    // Limit depth (0 = unlimited)
  showCurrent: true,              // Show current page in trail
  className: "text-sm text-white/70", // Default styling
}
```

**Example Configurations:**

```typescript
// Simple customization
breadcrumbs: {
  homeLabel: "Start",
  separator: "chevron",
}

// Limited depth for deep hierarchies
breadcrumbs: {
  maxDepth: 3,                   // Show: Home > Parent > Current
  showCurrent: false,            // Hide current page
}

// Localized breadcrumbs
breadcrumbs: {
  homeLabel: "Inicio",           // Spanish home label
  separator: "arrow",
}
```

**Component Overrides:**

```tsx
// Use default configuration
<Breadcrumbs breadcrumbs={document.breadcrumbs} />

// Override styles (replaces config className)
<Breadcrumbs
  breadcrumbs={document.breadcrumbs}
  className="text-lg text-gray-600"
/>

// Hide home link for specific instance
<Breadcrumbs
  breadcrumbs={document.breadcrumbs}
  showHome={false}
/>
```

### Media Storage Providers

Configure file storage based on your infrastructure:

```typescript
// Local storage (development)
media: {
  enabled: true,
  provider: "local",
}

// Vercel Blob (production)
media: {
  enabled: true,
  provider: "vercel-blob",
  config: {
    token: process.env.BLOB_READ_WRITE_TOKEN,
  },
}

// AWS S3 (enterprise)
media: {
  enabled: true,
  provider: "s3",
  config: {
    bucket: "my-bucket",
    region: "us-east-1",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
}
```

<a id="extensions--overrides"></a>
## 🧩 Extensions & Overrides

### Extensions (registering new content)

Extensions let you ship additional Payload collections, globals, blocks, or plugins without touching `src/admin`.

1. **Create the config** under `src/extensions/<type>/<slug>.ts`. Export a standard Payload config object (e.g., `CollectionConfig`).
2. **Register it in the extension registry** (`src/extensions/index.ts`). Import your file and add it to the appropriate export map (`collections`, `globals`, `blocks`, `plugins`).
3. **Enable it in `smartsite.config.ts`** by adding the slug to the corresponding `extensions.<type>` array. The resolver will pull the config from the registry and apply the same frontend wrappers used for core collections.

```ts
// src/smartsite.config.ts
extensions: {
  collections: ["faq"],
  blocks: ["testimonial-grid"],
  globals: [],
  plugins: [],
},
```

> Arrays in the `extensions` section replace the defaults rather than merging (see `deep-merge.ts`). Declare every extension slug you want active.

### Overrides (replacing core behaviour)

If you need to replace a built-in collection/global/block, drop a config with the same slug into the registry and the resolver will swap it automatically. Root collections (`users`, `uri-index`, `templates`) are always loaded, but any matching entry in the registry wins over the default.

```ts
defaultCollectionMap["pages"] // core definition
extensions.collections.pages   // optional override
```

The merge order is: defaults → registry overrides → user config (`smartsite.config.ts`). System collections always load exactly once. Custom extensions declared via `smartsite.config.ts` that are not found in the registry will throw a runtime error, preventing silent typos.

<a id="development-workflow"></a>
## 🛠 Development Workflow

### Recommended Development Process

1. **Start with sections** - 90% of development is building sections
2. **Use reusable fields** - Leverage pre-built field patterns
3. **Test in admin** - Verify fields work in Payload admin
4. **Style with Tailwind v4** - Use design tokens from `theme.css`
5. **Add animations** - GSAP for professional polish

### Common Tasks

| Task                  | Command/Location           | Notes                      |
| --------------------- | -------------------------- | -------------------------- |
| **Create section**    | `src/components/sections/` | config.ts + Component.tsx  |
| **Add field pattern** | `src/components/fields/`   | Reusable field groups      |
| **Customize admin**   | `src/smartsite.config.ts`  | Never edit /admin directly |
| **Add collection**    | `extensions.collections`   | In config file             |
| **Style frontend**    | `app/(frontend)/css/`      | Tailwind v4 styles         |
| **Add API route**     | `app/(frontend)/api/`      | Frontend endpoints         |

### Common Imports & Helpers

| Module | Exports | Notes |
| --- | --- | --- |
| `@/admin/cache` | `cache.getByURI`, `cache.getCollection`, `cache.getGlobal`, revalidation helpers (`revalidate`, `batchRevalidate`, `revalidateGlobal`, etc.) | Unified caching + invalidation API used across sections and API routes. |
| `@/admin/data/posts` | `getPostsWithPagination`, `getRecentPosts`, `getRelatedPosts` | Prebuilt queries for post listings and related posts. |
| `@/admin/data/globals` | `getGlobal`, `getSettings`, `getHomepage` | Fetches globals and resolves the homepage page doc. |
| `@/admin/data/user` | `getCurrentUser` | Reads the authenticated Payload user (for gating UI). |
| `@/components/ui/*` | Buttons, cards, breadcrumb primitives, command palette utilities | Shared UI primitives wired to design tokens. |
| `@/components/fields/*` | `sectionIntro`, `sectionCta`, `link`, `buttonsGroup`, etc. | Field builders used in section configs. |
| `@/admin/components/render-sections` | `PageData`, `RenderSections` | Context props injected into every section component. |

### Development Commands

```bash
# Start development
pnpm dev                # Main dev server

# Database management
pnpm seed              # Seed with sample data
pnpm db:reset          # Reset and reseed

# Type generation
pnpm generate:types    # Generate TypeScript types

# Code quality
pnpm lint              # Run linter
pnpm type-check        # TypeScript checks
```

### File Naming Conventions

- **Folders**: kebab-case (`hero-simple/`, `post-content/`)
- **Section files**: `config.ts` (fields) + `Component.tsx` (React)
- **Shared components/utilities**: kebab-case filenames (`heading-gradient.tsx`, `format-date.ts`)
- **Exports**: use named functions (no default arrow exports)

### AI Development

Tell your AI assistant to use specific rules:

- _"Create a new section using the adding-new-sections rule"_
- _"Convert this design using the screenshots rule"_
- _"Add animations following the GSAP rule"_

<a id="troubleshooting"></a>
## 🔧 Troubleshooting

### Common Issues

| Issue                        | Solution                                       |
| ---------------------------- | ---------------------------------------------- |
| **Types not generating**     | Run `pnpm generate:types`                      |
| **Sections not appearing**   | Check registration in `sections-map.tsx`       |
| **Admin changes lost**       | Use `smartsite.config.ts` instead              |
| **MongoDB connection fails** | Ensure the MongoDB service is running (brew services list / net start MongoDB) |
| **Build fails**              | Run `pnpm type-check` and fix errors           |
| **AI chat not working**      | Check AI backend is running on port 4112       |

### Debug Commands

```bash
# Check database connection
pnpm payload migrate:status

# Regenerate URI index
pnpm regenerate-uris

# Reset everything
pnpm db:reset

# View MongoDB databases
mongo --eval "db.adminCommand('listDatabases')"
```

<a id="deployment"></a>
## 🚀 Deployment

### Frontend Deployment (Vercel Recommended)

1. **Connect Repository**
   - Import smart-site project to Vercel
   - Configure build settings (auto-detected)

2. **Environment Variables**
   - Copy all variables from `.env`
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

<a id="additional-resources"></a>
## 📖 Additional Resources

- **[Payload CMS Documentation](https://payloadcms.com/docs)**
- **[Next.js 15 Documentation](https://nextjs.org/docs)**
- **[Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)**
- **[GSAP Documentation](https://greensock.com/docs/)**
- **[Mastra AI Documentation](https://mastra.ai/docs)**
- **[Smart Site AI Backend](../smart-site-ai/README.md)** - Separate AI backend documentation

<a id="contributing"></a>
## 🤝 Contributing

This is an internal tool for rapid website development. For questions or improvements, consult the development team.

<a id="license"></a>
## 📄 License

MIT License - See LICENSE file for details.
