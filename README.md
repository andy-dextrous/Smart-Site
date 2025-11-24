# Smart Site - Enterprise Website Builder

A **field-driven, section-first website builder** powered by **Next.js 16**, **Payload CMS 3**, **Tailwind CSS v4**, **GSAP**, and **AI integration via Mastra**, designed for rapid development of dynamic websites with enterprise-grade features.

## 📋 Table of Contents

- [Core Features](#core-features)
- [Installation & Getting Started](#installation--getting-started)
- [Architecture Overview](#architecture-overview)
- [Admin Layer System](#admin-layer-system)
- [AI Integration](#ai-integration)
- [Design System](#design-system)
- [Settings](#settings)
- [Templates](#templates)
- [Building Sections](#building-sections)
- [Routing & Caching](#routing--caching)
- [Configuration System](#configuration-system)
- [Adding Animations](#adding-animations)
- [Extensions & Overrides](#extensions--overrides)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)
- [Deployment](#deployment)
- [Additional Resources](#additional-resources)
- [Contributing](#contributing)
- [License](#license)
- [Staging Environments](#staging-environments)

<a id="core-features"></a>
## ⚡ Core Features

### Field-Driven Architecture

- **Reusable field patterns** - Pre-built field groups (`link`, `buttonsGroup`, `content`, etc.)
- **Type-safe components** - Automatic TypeScript generation from Payload schemas
- **Visual field editor** - Admin UI adapts to your field configurations
- **Smart defaults** - Sensible field defaults for rapid development

### Section-First Development

- **Installable section library** - Pull curated blocks from the Smart Site Sections Library (shadcn-style installer)
- **Component isolation** - Each section is self-contained with config + component
- **Drag-and-drop builder** - Arrange sections visually in Payload admin
- **Responsive by default** - All sections mobile-optimized with Tailwind v4

> The starter ships with an empty sections directory so you can decide what ships to clients. Install production-ready blocks from the Smart Site Sections Library when you need them, or author custom sections in-house.

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
- **Managed backend** - Secure AI processing through Wild Creative's Smart Site AI platform

<a id="installation--getting-started"></a>
## 🚀 Installation & Getting Started

### Prerequisites

- **Node.js 20+**
- **pnpm** (preferred package manager)
- **Database**: MongoDB Community (local via Homebrew) or MongoDB Atlas
- **File Storage**: Vercel Blob (recommended) or other storage solution
- **AI Backend**: Managed Smart Site AI platform (subscription access via andrew@wildcreative.com.au)

### 1. Project Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd <your-site-folder>

# Install dependencies
pnpm install
```

1. Run the interactive bootstrap with the Smart Site CLI (published to npm as `smartsite`). Always execute it from the project root so it can find `package.json` and `.env.example`.

   ```bash
   # One-off run without installing anything
   npx smartsite init --project .

   # Prefer a pinned dependency? add the CLI locally, then:
   pnpm smartsite init --project .
   ```

   The wizard copies `.env.example` to `.env`, generates secrets, collects database/storage/admin details, seeds baseline data, and (when seeding is enabled) keeps `next dev` running so you land on a ready-to-edit site.

### 2. Environment Configuration

> 💡 **Quick start**: `npx smartsite init --project .` (or `pnpm smartsite init --project .` after installing the CLI) handles `.env` creation, secret generation, database/storage selection, admin credentials, optional seeding, and can leave the dev server running when it finishes. AI access is requested later from the Smart Site admin once your project is ready.
>
> Need to re-run the baseline data later? Use `pnpm smartsite seed starter --start-dev` to boot a local dev server, call `/api/seed`, and keep the site running— or point at any URL with `--url https://staging.yoursite.com`.

The setup script writes these values into `.env`; use this reference when updating keys manually or configuring CI pipelines. For production and most proofs-of-concept we recommend pointing `DATABASE_URL` at MongoDB Atlas and using Vercel Blob for storage. Local values remain available for offline development.

```bash
# Core Configuration
NODE_ENV=development
NEXT_PUBLIC_URL=http://localhost:3000
PAYLOAD_CONFIG_PATH=./src/admin/payload/payload.config.ts

# Database (swap to Atlas URI for production)
DATABASE_PROVIDER=mongoose
DATABASE_URL="mongodb+srv://<username>:<password>@<cluster-url>/smart-site?retryWrites=true&w=majority"
# DATABASE_URL=mongodb://127.0.0.1:27017/smart-site-dev  # Optional local override

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


# AI Agent (auto-generated after setup)
AI_AGENT_API_KEY=

# Admin Seeding (Development)
PAYLOAD_ADMIN_EMAIL=admin@example.com
PAYLOAD_ADMIN_PASSWORD=SecurePassword123!
```

#### AI Environment Variables

- `AI_AGENT_API_KEY` — generated automatically during setup/seed. This is the only AI secret that ships in `.env.example`; the wizard writes the actual value after it provisions the hidden agent.

> Legacy placeholders (`SMARTSITE_AI_REGISTRATION_SECRET`, `SMARTSITE_SITE_NAME`) were removed. All onboarding now flows through the admin “Apply for AI Access” action described below, which keeps the local environment lean.

> Rerun the seed (or `pnpm smartsite ai rotate`) if `.env` ever loses the agent credentials. The command reconciles the database user and restores the values without regenerating keys unless a rotation flow is requested.

### Identity Configuration

Set the canonical site name in `src/smartsite.config.ts`:

```ts
// src/smartsite.config.ts
const config: UserConfig = {
  identity: {
    siteName: "Smart Site",
  },
  // ...
}
```

This value is used when seeding content, registering the AI agent, and rendering admin chrome. The CLI reads it automatically, so you no longer need `SMARTSITE_SITE_NAME` in `.env`.

### 3. Database Setup

Smart Site runs on MongoDB in every environment. PostgreSQL drivers remain in the repository for compatibility with legacy tooling, but the canonical configuration sets `DATABASE_PROVIDER=mongoose` and points `DATABASE_URL` at a MongoDB deployment.

#### Quick Start (Recommended): MongoDB Atlas + Vercel

1. **Provision MongoDB Atlas**
   - Create a Serverless or Dedicated cluster in the same region as your Vercel project.
   - Add a database user with read/write access and restrict IP access to Vercel (`0.0.0.0/0` initially, then tighten with the Vercel egress IPs).
   - Copy the SRV connection string and update `.env`:

     ```bash
     DATABASE_PROVIDER=mongoose
     DATABASE_URL="mongodb+srv://<username>:<password>@<cluster-url>/smart-site?retryWrites=true&w=majority"
     ```

2. **Set up Vercel project & Blob storage**
   - Create a new Vercel project and link it to your Smart Site repo.
   - Enable [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) and generate a **Read/Write token**. Add it to `.env`:

     ```bash
     BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
     ```

   - Optional: configure Resend (`RESEND_API_KEY`) or other email providers in Vercel secrets.

3. **Deploy & validate**
   - Push your repo and let Vercel build automatically.
   - In Vercel → Settings → Environment Variables, mirror the values from local development.
   - Trigger `pnpm seed` locally (with Atlas connection) or run the `/api/seed` route in production to populate data.

> Atlas + Vercel Blob is the default deployment path. Use the local instructions below only when you explicitly need an offline environment.

#### Local development (macOS and Linux)

1. Install MongoDB Community with Homebrew.

   ```bash
   brew tap mongodb/brew
   brew install mongodb-community@8.0
   brew services start mongodb-community@8.0
   ```

2. Verify the service and confirm connectivity.

   ```bash
   brew services list | grep mongodb
   mongosh "mongodb://127.0.0.1:27017" --eval "db.adminCommand('ping')"
   ```

3. Update `.env` for local development.

   ```bash
   DATABASE_PROVIDER=mongoose
   DATABASE_URL=mongodb://127.0.0.1:27017/smart-site-dev
   ```

4. Useful administration commands.

   ```bash
   brew services start mongodb-community@8.0
   brew services restart mongodb-community@8.0
   brew services stop mongodb-community@8.0
   brew services list | grep mongodb-community@8.0
   tail -f $(brew --prefix)/var/log/mongodb/mongo.log
   ```

Homebrew stores data in `$(brew --prefix)/var/mongodb` (for example `/usr/local/var/mongodb`) and logs in `$(brew --prefix)/var/log/mongodb/mongo.log`. One daemon can host any number of Smart Site databases—use different names (for example `smart-site-dev`, `smart-site-staging`) to keep environments isolated.

##### Backups and restores (macOS/Linux)

```bash
mkdir -p backups
mongodump --uri "${MONGODB_URI:-mongodb://127.0.0.1:27017/smart-site-dev}" --out ./backups/$(date +%Y%m%d-%H%M%S)
```

```bash
# Set MONGODB_URI to the target connection string and provide a BACKUP_PATH directory
MONGODB_URI="mongodb+srv://<username>:<password>@<cluster-url>/smart-site-prod" \
BACKUP_PATH=./backups/dev-YYYYMMDD-HHMMSS \
mongorestore --uri "$MONGODB_URI" "$BACKUP_PATH"
```

#### Local development (Windows)

1. Install MongoDB as a Windows service.

   ```powershell
   choco install mongodb --params "/InstallDirectory=C:\\Program Files\\MongoDB"
   net start MongoDB
   ```

   The installer registers the service and places data under `C:\Program Files\MongoDB\Server\<version>\data`. Keep the default port `27017` for parity with local scripts.

2. Install MongoDB Shell (mongosh) if it is not included.

   ```powershell
   choco install mongosh
   ```

3. Set the same environment variables in `.env` as the macOS/Linux flow.

   ```bash
   DATABASE_PROVIDER=mongoose
   DATABASE_URL=mongodb://127.0.0.1:27017/smart-site-dev
   ```

4. Manage the Windows service when required.

   ```powershell
   net stop MongoDB
   net start MongoDB
   ```

#### GUI tooling

- [MongoDB Compass](https://www.mongodb.com/products/compass) is the recommended GUI. Connect with `mongodb://127.0.0.1:27017` in development and paste Atlas connection strings for staging or production.
- The seed scripts create collections automatically; Compass will list them after the first request to `/api/seed` or after running `pnpm seed`.

#### Production and staging (MongoDB Atlas)

1. Provision a MongoDB Atlas cluster (Dedicated or Serverless) in the region closest to your deployment.
2. Create a database user with read/write access and restrict IP access to your deployment environments.
3. Copy the SRV connection string from Atlas and update the environment.

   ```bash
   DATABASE_PROVIDER=mongoose
   DATABASE_URL=mongodb+srv://<username>:<password>@<cluster-url>/smart-site-prod?retryWrites=true&w=majority
   ```

4. Redeploy Smart Site so the new environment variables take effect.

#### Moving data between environments

Use MongoDB’s native tools for a repeatable promote flow.

```bash
mongodump --uri "mongodb://127.0.0.1:27017/smart-site-dev" --out ./backups/dev-$(date +%Y%m%d-%H%M%S)
```

```bash
mongorestore --uri "mongodb+srv://<username>:<password>@<cluster-url>/smart-site-prod" ./backups/dev-YYYYMMDD-HHMMSS
```

> Prefer the CLI? Run `pnpm smartsite staging pull` or `pnpm smartsite staging push` to wrap the same workflow (backups, protected collections, and environment overrides) without remembering the raw `mongodump` commands.

Run seeding (`pnpm smartsite seed starter` or `pnpm seed`) only against development databases. Once a staging or production environment is active, use the promote flow above or Payload admin exports to transfer content.

### 4. AI Backend Setup

Smart Site runs standalone out of the box. To enable AI features you connect to the managed Smart Site AI platform operated by Wild Creative. There is no customer-managed installation step—after seeding, contact andrew@wildcreative.com.au (or use the upcoming admin “Apply for AI Access” action) and they will activate your workspace. Until approval the AI sidebar remains disabled, but your local agent credentials are ready.

### 5. Development Server

```bash
# Start development server
pnpm dev
```

### 6. Database Seeding & Initial Setup

> **🗃️ Important:** The setup wizard (`smartsite init --project .`) seeds the minimal profile for you. Use the commands below only when you need to reseed or switch profiles.

The wizard already seeds the **minimal** profile so you can start building immediately. Rerun the seed only after intentionally wiping the database.

#### Reseeding from the command line

1. Ensure the dev server is running (`pnpm dev`).
2. Run the seeding script (minimal profile only):

   ```bash
   pnpm seed
   ```

   The wizard prompts for a site name during setup; rerun `smartsite init --project .` or call the seed endpoint with a custom `siteName` to change the label.

#### Minimal seed contents

The minimal profile is intentionally lean, giving editors the essentials without opinionated marketing copy:

- **Admin user** using the credentials you entered during setup.
- **Primary contact form** stored in the Forms collection (name, email, phone, message, confirmation workflow, notification email).
- **Pages**:
  - `Home` with a hero + content block that explains how to start building sections.
  - `Contact` with a hero and the primary contact form already embedded.
  - `Privacy Policy` and `Terms` with placeholder content ready to replace.
- **Navigation**:
  - Header links for Home and Contact.
  - Footer legal links for Privacy Policy and Terms.
  - *Remember*: headers and footers are managed via Payload globals (`globals/header`, `globals/footer`). Never implement them as sections; update the globals in admin or via `smartsite.config.ts` overrides.
- **Global settings** preconfigured with site name/description, SEO defaults (including robots.txt), and routing that points the homepage field at the seeded Home page. Social links, locations, analytics IDs, and templates are intentionally left blank for you to fill in.

This starter ships only the minimal profile so you can build bespoke sites without demo noise. If you need richer marketing content for inspiration, use the separate Smart Site demo repository (it mirrors the same architecture but seeds additional pages, posts, and animations).

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
pnpm seed             # Seed demo content (requires dev server at :3000)
# Run the two commands above sequentially to rebuild the schema and reseed
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
| **Framework** | Next.js 16 App Router | React framework with server components |
| **CMS**       | Payload CMS 3         | Headless CMS with visual editor        |
| **Styling**   | Tailwind CSS v4       | Utility-first CSS with design tokens   |
| **Animation** | GSAP + ScrollTrigger  | Professional animations                |
| **AI**        | Mastra Framework      | Remote AI backend integration          |
| **Database**  | MongoDB/PostgreSQL    | Content storage                        |
| **Storage**   | Vercel Blob/S3        | Media file storage                     |
| **Language**  | TypeScript            | Type safety throughout                 |

### Directory Structure

```
.
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
│   │   │       ├── spacing.css           # Fluid spacing scale
│   │   │       ├── colors.css            # Brand palette tokens
│   │   │       └── typography.css        # Typography system
│   │   └── (payload)/                    # 🔐 Admin panel routes
│   │       ├── admin/                    # Payload admin UI
│   │       └── api/                      # CMS API endpoints
│   │
│   ├── components/                       # 🎨 Frontend components
│   │   ├── sections/                     # 📦 Sections you install or create (starter ships empty)
│   │   │   ├── config.ts                 # Section registry
│   │   │   ├── sections-map.tsx          # Component mapping
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
6. Commit and push your changes
7. Create and push a git tag in this repo: vX.Y.Z (e.g., v2.3.5)
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

1. **Development** - New features built in this master environment.
2. **Version bump** - Update `version` and `releaseDate` in `src/admin/package.json`.
3. **Test** - Features tested with demo data.
4. **Release** - Create and push a git tag `vX.Y.Z` on `master` in this repo; the `release-smart-site` workflow syncs the starter into `andy-dextrous/Smart-Site` and creates a GitHub release.
5. **Update** - Client sites pull updates via SmartSite CLI.
6. **Dependencies** - CLI auto-syncs required packages from the admin manifest.
7. **Install** - Clients run `pnpm install` to get new packages.

<a id="ai-integration"></a>
## 🤖 AI Integration

Smart Site includes powerful AI features via the **Mastra framework**, with processing handled by a remote backend for security and scalability. The starter prepares an AI agent identity during seeding, but the workspace only activates after Wild Creative approves the site.

### Initial Connection Flow

1. Confirm `identity.siteName` and `features.ai.enabled` are set in `src/smartsite.config.ts`.
2. Run the standard seed flow (`pnpm seed`, the `/api/seed` endpoint, or the interactive setup script). The hidden `ai-agent` user is ensured and the generated `AI_AGENT_API_KEY` value is written to `.env`.
3. From the Payload admin, open **AI Settings** and click **Apply for AI Access**. This sends the workspace metadata to Wild Creative (andrew@wildcreative.com.au). While your site is pending, the workspace sidebar stays disabled but you can continue configuring context fields.

### AI Workspace Approval Flow

- The starter now proxies two control-plane endpoints: `GET /api/ai/status` and `POST /api/ai/apply`. They forward the stored API key + site ID to the Smart Site AI backend so admins never paste secrets into browsers.
- **Status states** returned by the control plane are normalized to `inactive`, `pending`, `active`, `suspended`, `unauthorized`, or `error`. Only the `active` state renders the workspace shell, chat sidebar, and admin toggle; every other state hides them completely to avoid confusing non-approved users.
- **Apply for AI Access** only appears when the status is `inactive` or `pending`. Submitting the form records your site metadata and the requesting admin, then notifies Wild Creative for manual approval. The gate re-polls status every 15 seconds so the UI flips to “Active” moments after approval without needing a reload.
- Once approved, the status endpoint returns `active`, the workspace shell hydrates on every page, and the Cmd + L hotkey/admin toggle become available again. If the backend revokes access later (e.g., `suspended`), the same status check instantly hides the sidebar across the whole site.

### Regenerating Credentials Later

Run the helper any time you need to reconcile the AI agent credentials with your `.env` file:

```bash
pnpm smartsite ai rotate         # Ensure the ai-agent user exists and sync the current API key into .env
pnpm smartsite ai rotate --force # Issue a brand-new API key (coordinate with Wild Creative before executing)

# Legacy fallback when the CLI is unavailable
pnpm smartsite ai rotate
pnpm smartsite ai rotate --force
```

The command never deletes content—it simply regenerates the API key when requested and persists the updated values.

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

Configure AI in `src/smartsite.config.ts` by toggling `features.ai.enabled`. Leave `features.ai.endpoint` and other advanced options at their defaults unless Wild Creative gives you a managed override.

### Backend Setup

No backend deployment is required on the client side. The Smart Site AI platform is operated by Wild Creative and shared across subscribing sites. Reach out to andrew@wildcreative.com.au if you need to confirm uptime or request regional routing changes.

### AI Backend Authentication System

Smart Site authenticates with the AI backend using a special "AI Agent" user pattern:

#### CLI Shortcuts

- `pnpm smartsite ai status` — print the current workspace enablement state.
- `pnpm smartsite ai apply` — submit or retry the approval request without opening Payload.
- `pnpm smartsite ai rotate` — reconcile/rotate the API key when credentials are missing or compromised.

#### How Authentication Works

1. **AI Agent User**: Each Smart Site instance has a hidden user with role `ai-agent`
2. **API Key Generation**: This user has an API key (64-character hex string) for authentication
3. **Auto-Creation**: The AI agent is automatically created during database seeding
4. **Environment Storage**: Credentials are saved to `.env` (rerunnable with `pnpm smartsite ai rotate`):

```bash
# AI Agent Configuration (auto-generated example)
AI_AGENT_API_KEY=80fda7460be5a83e4dc8256392bba4baacdd48777fd5eb1bdd13a1c1b9a25375
# AI agent identifiers are managed automatically in the database
```

#### Setting Up AI Authentication

1. **Run Database Seeding**:

```bash
pnpm seed
```

   Use `pnpm seed:demo` when you need the full demo profile for showcase content.

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
    "X-Site-ID": "<resolved ai-agent user id>",
    "X-Site-URL": NEXT_PUBLIC_URL,
  },
})
```

#### End-to-End Request Flow

1. Frontend API routes under `app/(frontend)/api/ai/*` validate the shared secret, add the `X-Site-ID` header, and proxy requests to the Mastra backend.
2. The managed Smart Site AI backend operated by Wild Creative verifies the site ID/API key pair, loads the correct workspace, and runs the requested chat/thread/schema operation.
3. Responses stream back through the proxy so the admin chat panel and public endpoints never expose Mastra credentials directly.
4. `ensureAIAgentWithAPIKey` keeps the Payload AI agent user and `.env` credentials synchronized during seeding, preserving a single Smart Site identity; you can rerun this logic later via `pnpm smartsite ai rotate` (add `--force` to rotate the key).

> Backend provisioning is handled entirely by Wild Creative. If you need to confirm connectivity or request changes, email andrew@wildcreative.com.au rather than attempting to deploy your own instance.

#### Security Features

- **Hidden User**: AI agent never appears in admin UI
- **Encrypted Storage**: API keys are encrypted in database using `PAYLOAD_SECRET`
- **One-Time Display**: API key shown only during creation
- **Role Isolation**: `ai-agent` role has specific access patterns
- **Multi-Tenant Ready**: Each site has unique credentials

<a id="design-system"></a>
## 🎨 Design System

Smart Site ships a CSS-first, tokenized design system under `src/app/(frontend)/css`. Tailwind v4 generates utilities directly from the `@theme` tokens, so you use simple classes instead of hand-wiring `var(...)` in JSX. The guidance below folds in the canonical rules that previously lived in `DESIGN-SYSTEM.md`; treat this section as the source of truth when styling sections or components.

### CSS Sources
- `theme.css` – radii, shadow elevations, motion timings/easings.
- `spacing.css` – spacing scale, section/content/grid tokens, containers, nav/logo heights, control ratios, offsets.
- `typography.css` – fluid type base/min/max, ratio, semantic steps (`--text-*`, `--text-h*`), body/heading roles.
- `colors.css` – brand palette (`--color-*`) and role tokens (borders, surfaces).
- `base.css` – global background/text colours and section paddings.
- `utilities.css` – container helpers and small cross-component utilities.

### Token Architecture

- **Human-controlled tokens** live in the configurable `@theme` blocks at the top of `spacing.css`, `typography.css`, `colors.css`, and `theme.css`. These are the only values designers and implementers should override:
  - Typography: `--font-*`, `--line-height-*`, `--fluid-text-base-min`, `--fluid-text-base-max`, `--fluid-text-viewport-min`, `--fluid-text-viewport-max`, `--fluid-text-scale-min`, `--fluid-text-scale-max`, `--color-body`, `--color-heading`.
  - Spacing: `--fluid-space-base-min`, `--fluid-space-base-max`, `--fluid-space-viewport-min`, `--fluid-space-viewport-max`, `--fluid-space-ratio-min`, `--fluid-space-ratio-max`.
  - Containers: `--container-width-*`, `--container-md-width-*`, `--container-sm-width-*`.
  - Utilities: `--spacing-logo`, `--spacing-nav`, control scales (`--control-scale-*`), colour palettes (`--color-*`).
- **Derived tokens** in the second `@theme` block are computed from the knobs above. Never edit or override them directly:
  - Typography steps (`--fluid-text-step-*`, `--text-*`, `--text-h*`).
  - Spacing scale (`--fluid-space-*`, `--spacing-section-*`, `--spacing-content-*`, `--spacing-content-xss`, `--spacing-grid-*`, `--spacing-control-*`).
  - Container clamps (`--spacing-container*`), offsets, and helpers such as `--spacing-container-gap`.
  - Progress helpers (`--fluid-text-progress`, `--fluid-space-progress`).

Adjust the inputs, let the pre-computed outputs follow. Tailwind 4 automatically emits utilities for every token (`--spacing-content` → `gap-content`, `--spacing-grid` → `gap-grid`, `--text-h2` → `text-h2`, `--text-sm` → `text-sm`), so use the generated classes instead of re-declaring values.

### Tailwind 4 Theme Integration

- Tailwind builds utilities from `@theme` declarations at compile time. To apply a token, use the matching utility (`py-section-y`, `gap-content`, `gap-grid`, `text-h3`, `text-sm`, etc.). Do not create custom classes like `gap-[var(--spacing-content)]`.
- Prefer layout primitives (`flex`, `grid`) with gap utilities. Avoid stacking `mt-*`/`mb-*` on siblings—spacing should be controlled by a parent container.
- Resolve class names with `tailwind-variants` (or constants) and pass the resulting strings into JSX. Avoid calling slot helpers inline—compute them once above the return as illustrated in the section rules.
- When you must write CSS, import from `@/app/(frontend)/css/spacing.css`, `colors.css`, or `typography.css` and consume the variables directly. Do not define duplicate hard-coded values in component styles.

### Typography System

The fluid type scale is powered by a single modular ratio with configurable bounds.

- **Control tokens**
  - Base size: `--fluid-text-base-min` (mobile) and `--fluid-text-base-max` (desktop).
  - Viewport ramp: `--fluid-text-viewport-min`, `--fluid-text-viewport-max`. The interpolation runs from min → max; outside the range it clamps.
  - Scale range: `--fluid-text-scale-min`, `--fluid-text-scale-max` (default 1.2 → 1.25). Lower values compress the hierarchy; higher values stretch headings.
  - Families and roles: `--font-body`, `--font-heading`, `--font-fallback-sans`, plus the per-role line-height and letter-spacing tokens.
- **Derived tokens**
  - Steps: `--fluid-text-step--2` through `--fluid-text-step-6`.
  - Semantic aliases: `--text-xs` → `--text-5xl`, `--text-h6` → `--text-h1`.
- **Usage rules**
  - Components should use the generated utilities (`text-h2`, `text-sm`, `text-base`, `text-lg`, `text-xs`, etc.) or inherit from semantic tags. Never hard-code pixel sizes in JSX or component CSS.
  - Body copy, lists, and blockquotes rely on global rules in `typography.css`. Leave them untouched unless the component demands a distinct style (e.g. a metric counter).
  - Rich text from Payload should live inside the shared `RichText` component. It inherits the global tokens, so no `.prose` overrides or body IDs are required. Use the `not-prose` helpers when you need to inject bespoke layouts inside the document flow.
  - Lean on the body-scale utilities (`text-xs`, `text-sm`, `text-base`, `text-lg`) for navigation, metadata, and legal copy. Pair them with tracking/weight utilities as needed (e.g. uppercase + custom letter spacing for pre-headings).
  - To adjust typography for a client build, override the control tokens in that app’s own theme sheet. Do not copy `typography.css`—only change the inputs.

### Spacing System

Spacing uses a mirrored modular scale that also interpolates between min and max breakpoints.

- **Control tokens**
  - Base padding: `--fluid-space-base-min` (mobile), `--fluid-space-base-max` (desktop).
  - Ramp: `--fluid-space-viewport-min`, `--fluid-space-viewport-max`.
  - Ratio range: `--fluid-space-ratio-min`, `--fluid-space-ratio-max` (default 1.28 → 1.36) for progressive loosening across viewports.
  - Container widths: `--container-width-*`, `--container-md-width-*`, `--container-sm-width-*`. These follow the same progress curve as space.
  - Utility anchors: `--spacing-logo`, `--spacing-nav` for chrome sizing.
  - Control scales: `--control-scale-*` feed button/input padding without diverging from the core rhythm.
- **Derived tokens**
  - Steps: `--fluid-space-0` → `--fluid-space-7`.
  - Section spacing: `--spacing-section-*`, `--spacing-section-x`, `--spacing-section-y`.
  - Content spacing: `--spacing-content-xss`, `--spacing-content-*`, `--spacing-grid-*`.
  - Control spacing: `--spacing-control-*` for form controls and compact chrome.
  - Containers: `--spacing-container`, `--spacing-container-md`, `--spacing-container-sm`, `--spacing-container-gap`, plus offset helpers.
- **Usage rules**
  - Sections must render through the shared `<Section>` wrapper so vertical rhythm, padding, and colour schemes stay consistent. Avoid layering additional `py-section-*` utilities inside the component.
  - Interior layouts should rely on `gap-content-*`, `px-content`, etc. Keep the same semantic tokens for padding, gap, and margin to avoid breaking the scale.
  - Cards, feature blocks, and CTA wrappers should pull padding and gaps from the content scale (`p-content`, `gap-content-*`). Use the control scale (`px-[--spacing-control-*]`) for dense UI chrome like buttons or inputs.
  - Grid layouts should combine `grid-cols-*` with `gap-grid`, `gap-grid-lg`, etc. Use the `gap-grid` scale only inside CSS grid containers; flexbox layouts should stay on the content scale.
  - Default section gutters map to `--spacing-section-md` horizontally and `--spacing-section-lg` vertically. Override the semantic tokens, not the raw fluid steps, when you need different defaults.
  - Container utilities (`container`, `container-md`, `container-sm`) map to the computed widths. Use the offset tokens (`spacing-container-offset`) for full-bleed elements that need to align with container edges.

### Colour Tokens

- Primary and secondary palettes follow Tailwind’s Indigo and Sky scales; use `text-primary-500`, `bg-secondary-600`, etc. for brand accents.
- `--color-dark-*` drives typography, borders, and dark surfaces. `--color-neutral` and `--color-white` handle light surfaces.
- Border tokens (`--color-dark-border`, `--color-light-border`) standardise separators. Reach for `border-dark-border` / `border-light-border` instead of arbitrary opacity adjustments.

### Rich Text and Prose

- The `RichText` component already strips Tailwind Prose defaults and relies on our tokens. Do not reintroduce `.prose` or bespoke selectors around Payload content.
- Use `data-rich-text` or component-level class hooks only when you need contextual colour themes (e.g. inverted sections). Modify colour tokens (`--color-body`, `--color-heading`) on the parent rather than overriding every element.
- For articles that must use traditional long-form spacing, apply a specific variant class that toggles the section/content spacing tokens; never hand-write margins on individual headings or paragraphs.

### Implementation Checklist

- [ ] Wrap every top-level section with the shared `<Section>` component so vertical rhythm, colour schemes, and padding come from Section Settings.
- [ ] Apply container utilities instead of width clamps in JSX or CSS.
- [ ] Pick typography utilities (`text-h*`, `text-xs/sm/base/lg`, `leading-*`) rather than raw pixel values.
- [ ] Use gap and padding tokens for component spacing. If you need a custom size, add it as a new control token rather than hard-coding.
- [ ] When adding new theme inputs, document them here and keep the derived calculations together so Tailwind continues to generate utilities.
- [ ] Never edit the computed token block. Change the inputs, test the cascade, and ensure Tailwind picks up the new classes.

### Client and Demo Overrides

- Client deployments generated from this starter should only override human-controlled tokens in their local `spacing.css`, `colors.css`, or `typography.css`. Avoid copying computed tokens—share the same calculations to guarantee consistency.
- The public Smart Site demo may experiment with different ratios or container widths, but changes that should ship to clients must land in this starter first.
- When shipping a customised client palette, keep the same token names (`--color-primary-*`). The CLI depends on those names to wire components at generate time.

Adhering to these rules keeps every Smart Site instance portable, predictable, and easy to tune. If a new pattern requires additional tokens, add them alongside the existing inputs and extend this section so downstream implementers understand how to use them.
<a id="building-sections"></a>
## 📦 Building Sections

Sections are the core building blocks of Smart Site. The guidance below merges the full `SMARTSITE-SECTION-DESIGN.md` playbook into this README; follow it whenever you plan, implement, or review a section.

### Section Architecture

| File | Purpose | Location |
| --------------- | ------------------------- | ------------------------------- |
| `config.ts` | Payload fields definition | `sections/[name]/config.ts` |
| `Component.tsx` | React component | `sections/[name]/Component.tsx` |

### Quick Start

1. Create the section folder (kebab-case).

   ```bash
   mkdir src/components/sections/hero-banner
   ```

2. Scaffold the required files.

   ```bash
   touch src/components/sections/hero-banner/{config.ts,Component.tsx}
   ```

3. Register the section immediately in both registries.

   ```typescript
   // src/components/sections/config.ts
   export { HeroBanner } from "./hero-banner/config"

   // src/components/sections/sections-map.tsx
   import { HeroBannerComponent } from "./hero-banner/Component"

   export const sectionsMap = {
     "hero-banner": HeroBannerComponent,
   }
   ```

4. Populate `config.ts` / `Component.tsx` using the rules that follow.

### Reusable Field Patterns

Smart Site provides pre-built field groups so schemas stay consistent. Import only the helpers a section truly needs.

| Field Group | Purpose | Includes |
| -------------------- | ------------------ | ------------------------------- |
| `link()` | Smart linking | Internal/external/anchor |
| `buttonsGroup()` | Button clusters | Array of buttons |
| `button()` | Single action | Label, URL, variant |
| `sectionCta()` | Call-to-action bar | Button text, link, style |
| `sectionIntro()` | Optional heading | Heading, description, alignment |
| `image()` | Media upload | Image-only upload field |

### Section Best Practices

✅ **Do** keep folders in kebab-case (`hero-banner`), re-use field patterns, keep sections generic, and reach for architectural names (`card-grid`, `text-image`).

❌ **Don’t** create page-specific sections (`about-hero`), hardcode content inside components, mix admin and frontend imports, or skip generated types.

### 1. Section Folder Contract

- Locate sections in `src/components/sections/<section-name>/`.
- Use kebab-case for directory and file names (`feature-grid`, `stats-overview`).
- Each section always exports a server-safe entry point and may optionally attach client helpers:
  - `config.ts` — Payload `Block` definition (no client-only code).
  - `Component.tsx` — React implementation. Default to a server component, but it can be client-side if the entire section needs interactivity (animations, form state, etc.).
  - Optional `client.tsx` (or `component-client.tsx`) for interactive behaviour when you want to keep the main component on the server. Import it lazily from `Component.tsx` and keep it colocated.
- Register the section immediately:
  - Add the `Block` to `src/components/sections/config.ts` under `sections.sectionBlocks`.
  - Map the slug to the component in `src/components/sections/sections-map.tsx`.
- All sections receive shared page context props when rendered:
  - `document` – the current Payload document (Page/Post/etc.).
  - `collection` – the collection slug of that document.
  - `breadcrumbs` – array used for navigational trails.
  - `searchParams` – parsed query string.
  - `params` – dynamic route params (e.g. `uri` segments). Treat these as optional; guard their usage inside the component.
- Keep individual folders self-contained. Shared helpers belong in `src/components/fields` or `src/components/ui` so the CLI can install sections without chasing deep relative imports.

### 2. Payload Config Rules (`config.ts`)

Follow the patterns in this section.

- Start with the brief. Model only the fields the section actually needs to satisfy the client or design intent; resist adding optional knobs "just in case." When the request is unclear, pause and ask for clarification before inflating the schema.
- Always use the shared field factories for core primitives:
  - Links route through the `link()`/`CMSLink` field set so internal/external references stay normalized.
  - Media (images, video) uses the `media` field + `<Media>` component to respect responsive sizing and metadata.
- Rich text content should rely on the shared `richText()` field + `<RichText>` renderer. Keep the default variant so it inherits typography tokens; only opt into the `prose`/article variant for long-form content such as blog posts.
- Import field presets from `@/components/fields/*` whenever they exist (link, media, section-cta, content, etc.). Never duplicate schemas inline.
- Wrap logical groups in `collapsible` blocks. Default to open for primary content, closed for supporting controls.
- Provide `label`, `admin.description`, and `admin.placeholder` strings to explain author intent.
- Set `slug` equal to the folder name; set `interfaceName` so TypeScript components receive strong types (`HeroBlock`, `FeatureGridBlock`).
- Run `sectionSettings()` as the final field to expose shared colour/container/padding controls.
- Avoid bespoke collections unless absolutely required. When you need additional relationships, prefer existing global collections or propose extensions in ADRs before adding new ones.
- Keep defaults sensible: choose the most common layout or toggle as `defaultValue`, especially for stylistic selectors (alignment, size, colour scheme, layout variants). Components should be able to rely on these defaults without re-normalising values.
- When you have multiple small, related settings (e.g. paired toggles, select boxes, numeric inputs), wrap them in a `type: "row"` so editors see them inline.

```ts
import type { Block } from "payload"

import { link } from "@/components/fields/link/link"
import { sectionSettings } from "@/components/fields/section"

export const Hero: Block = {
  slug: "hero",
  interfaceName: "HeroBlock",
  fields: [
    {
      type: "collapsible",
      label: "Content",
      fields: [
        { name: "preheading", type: "text", admin: { placeholder: "Optional label" } },
        { name: "heading", type: "text", required: true },
        { name: "supportingText", type: "textarea", admin: { rows: 4 } },
      ],
    },
    {
      type: "collapsible",
      label: "Media",
      admin: { initCollapsed: true },
      fields: [
        {
          name: "backgroundImage",
          type: "upload",
          relationTo: "media",
        },
      ],
    },
    {
      type: "collapsible",
      label: "Layout",
      admin: { initCollapsed: true },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "size",
              type: "select",
              defaultValue: "large",
              options: [
                { label: "Full viewport", value: "full" },
                { label: "Large", value: "large" },
                { label: "Medium", value: "medium" },
                { label: "Compact", value: "small" },
              ],
            },
            {
              name: "alignment",
              type: "select",
              defaultValue: "left",
              options: [
                { label: "Left aligned", value: "left" },
                { label: "Centre aligned", value: "center" },
              ],
            },
            {
              name: "visualStyle",
              type: "select",
              defaultValue: "classic",
              options: [
                { label: "Classic", value: "classic" },
                { label: "Image overlay", value: "image-overlay" },
                { label: "Gradient panel", value: "gradient" },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "collapsible",
      label: "Buttons",
      admin: { initCollapsed: true },
      fields: [
        {
          name: "buttons",
          type: "array",
          defaultValue: [],
          fields: [
            link({
              optional: true,
              defaultAppearance: "button",
              overrides: { name: "button" },
            }),
          ],
        },
      ],
    },
    sectionSettings(),
  ],
}
```

### 3. Component Rules (`Component.tsx`)

- Import generated types from `@/admin/payload/payload-types` and annotate the function signature (e.g. `export function HeroComponent(props: HeroBlock)`).
- Wrap every section in the shared `<Section>` component. Only set `disableContainer` when the design truly needs full-bleed content.
- Reach for design-system utilities instead of custom values. Cross-reference the design system rules; never hard-code pixel sizes or bespoke Tailwind classes that duplicate the shared tokens.
- Re-use shared field components (`CMSLink`, `RichText`, `Media`, `ButtonsGroup`, etc.) so data normalization stays consistent. When a field returns an array, map through a normalized helper before rendering.
- Let Payload defaults do the heavy lifting. Avoid re-normalizing enum values inside the component—read the generated types, trust `defaultValue`, and handle `null` cases only when the schema marks a field as optional.
- Drive layout and tone through `tailwind-variants` (or an equivalent class map) and resolve all slot classes up front:
  - Declare slots for every region (`section`, `content`, `wrapper`, `copy`, `supporting`, `buttonItem`, etc.).
  - Assign the resolved strings to constants (e.g. `const wrapperClassName = wrapper()`) and pass them to JSX. Do not call the slot helpers inline.
  - If you see `className={slot()}` in JSX, move that call to a constant above the return.
  - Use variants to switch tone (`light` vs `dark`), alignment, container flush states, and per-element spacing rather than injecting conditional `cn()` calls in the markup.
- When rendering media, pass the raw field value directly to `<Media>`. The component ignores non-object inputs; no local `typeof === "object"` guards are needed.
- Keep markup lean. Avoid redundant wrappers, stray `div`s, or re-exported fragments—structure should match the visual intent exactly.
- Always import the generated Payload types; never recreate interfaces or enums locally.
- Guard optional content (`if (!heading) return null` or inline ternaries). Never render empty wrappers.
- Keep logic declarative. Derive class names with maps keyed by enumerations, not by if/else blocks scattered throughout the JSX.
- Use Tailwind utilities first. When you need bespoke styling, extend the shared CSS layers (`spacing.css`, `typography.css`, `colors.css`, `utilities.css`) instead of creating local modules, and source every value from the design tokens.
- Do not mutate props. Derive new objects or arrays locally.
- Mark `Component.tsx` with `"use client"` when the whole section needs interactive behaviour. Otherwise, keep it server-side and split interactivity into an optional `client.tsx` that you lazy-load and pass only the required props.

```tsx
/*************************************************************************/
/*  HERO VARIANTS                                                        */
/*************************************************************************/
const heroVariants = tv({
  slots: {
    section: "relative isolate overflow-hidden",
    content: "relative z-10 w-full",
    wrapper: "gap-content flex flex-col",
    copy: "gap-content-sm flex flex-col",
    buttons: "gap-content-sm flex flex-wrap items-center",
    preheading: "text-xs uppercase tracking-widest",
    heading: "",
    supporting: "max-w-2xl text-pretty",
    buttonItem: "gap-content-xs inline-flex items-center",
  },
  variants: {
    alignment: {
      left: { wrapper: "items-start text-left" },
      center: {
        wrapper: "items-center text-center",
        copy: "items-center text-center",
        buttons: "justify-center",
        preheading: "mx-auto",
        supporting: "mx-auto text-center",
      },
    },
    tone: {
      light: {
        preheading: "text-dark-500",
        supporting: "text-dark-600",
      },
      dark: {
        section: "text-white",
        preheading: "text-white/80",
        heading: "text-white",
        supporting: "text-white/80",
      },
    },
  },
  defaultVariants: {
    alignment: "left",
    tone: "light",
  },
})

export function HeroComponent(props: HeroBlock) {
  const {
    heading,
    preheading,
    supportingText,
    buttons = [],
    alignment = "left",
    visualStyle = "classic",
    sectionSettings,
  } = props

  /**
   * Payload Fields
   */
  const heroButtons = buttons.filter(buttonItem => Boolean(buttonItem?.button))
  const hasButtons = heroButtons.length > 0
  const tone = visualStyle === "image-overlay" ? "dark" : "light"

  /**
   * Tailwind Variants
   */
  const {
    section,
    content,
    wrapper,
    copy,
    buttons: buttonsSlot,
    preheading: preheadingSlot,
    heading: headingSlot,
    supporting: supportingSlot,
    buttonItem,
  } = heroVariants({
    alignment,
    tone,
  })

  /**
   * Class Names
   */
  const sectionClassName = section()
  const contentClassName = content()
  const wrapperClassName = wrapper()
  const copyClassName = copy()
  const buttonsClassName = buttonsSlot()
  const preheadingClassName = preheadingSlot()
  const headingClassName = headingSlot()
  const supportingClassName = supportingSlot()
  const buttonItemClassName = buttonItem()

  /**
   * Render
   */
  return (
    <Section sectionSettings={sectionSettings} className={sectionClassName}>
      <div className={contentClassName}>
        <div className={wrapperClassName}>
          <div className={copyClassName}>
            {preheading ? <p className={preheadingClassName}>{preheading}</p> : null}
            <h1 className={headingClassName}>{heading}</h1>
            {supportingText ? (
              <p className={supportingClassName}>{supportingText}</p>
            ) : null}
          </div>

          {hasButtons ? (
            <div className={buttonsClassName}>
              {heroButtons.map((buttonItem, index) => (
                <CMSLink
                  key={`hero-button-${index}`}
                  {...buttonItem.button!}
                  className={buttonItemClassName}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </Section>
  )
}
```

- Block comment headers (e.g. `/*************************************************************************/`) belong at the very top of a file. Inside components, favour the inline JSDoc-style separators (`/** … */`) shown in the example to mark major logic groups.

### 4. Data Access & Caching

- Rely on the injected page context first. Every section receives `document`, `collection`, `breadcrumbs`, `searchParams`, and `params`; prefer these props before issuing new queries.
- When additional data is required, import `cache` from `@/admin/cache` and call the shared helpers server-side. Core methods: `getByURI`, `getBySlug`, `getByID`, `getCollection`, `getGlobal`, `getAllURIs`.
- Avoid calling `getPayload()` or direct fetches inside sections. Wrap cache calls in domain helpers under `src/lib/<domain>/…` (or the client’s `src/lib`) so the logic stays reusable and inherits smart revalidation.
- Match the cache API’s `QueryOptions` shape (`limit`, `sort`, `where`, `depth`, `overrideAccess`, `draft`) when composing queries. This keeps invalidation tags accurate.
- Only expose section-level toggles for draft or alternate datasets when a user story demands it. Otherwise, let the defaults (published content, depth 5) flow from the cache helpers.

#### Pagination patterns

- Reuse the shared pagination tooling instead of rolling custom “next/previous” controls. The canonical implementation lives alongside the posts archive:
  - Fetch paginated data through a helper that returns `docs`, `page`, `totalPages`, and `totalDocs` (e.g. `getPostsWithPagination`).
  - Drive the page index from `searchParams.page` and always coerce it to a positive integer.
  - Pass the resulting metadata straight into `<Pagination>` (for the button group) and `<PageRange>` (for the “Showing x–y of z” copy). Both components live in `@/components/fields/pagination` and accept tone-aware props.
  - Build the destination URL once via an `archiveUri` (usually the current document breadcrumb). The component handles appending `?page=`—do not concatenate page numbers manually.
- Config schema: expose toggles such as “Show pagination” or “Show page range” plus basic settings (page size, sort order). Avoid re-declaring link arrays or explicit page labels; the pagination field set owns that UI.
- When another section needs pagination, mirror the `PostsArchiveComponent` structure: fetch, derive the archive URI, render your collection grid/list, then hand the metadata to the shared pagination components.

### 5. Layout, Spacing, and Containers

- Vertical rhythm is handled by the `<Section>` wrapper. Do not add `py-section-*` utilities directly inside a section component—the wrapper already applies the default rhythm and Section Settings adjust it when required.
- Containers:
  - Default to `container`. This default is enforced via `sectionSettings` (`defaultValue: "lg"`). Do not set container utilities manually inside the component.
  - When a narrower presentation is required, rely on Section Settings to switch to `container-md` or `container-sm`.
  - For true full-bleed content (media strips, banners), use `disableContainer` and manage padding with section settings.
- Interior spacing pulls from two coordinated scales:
  - **Content scale** (`gap-content-xss`, `gap-content-xs`, `gap-content-sm`, `gap-content`, `gap-content-lg`, `gap-content-xl`, `gap-content-xxl`, with matching padding utilities `p-content-*`). Use these for flex layouts, stacks, cards, and component padding.
  - **Grid scale** (`gap-grid-xs`, `gap-grid-sm`, `gap-grid`, `gap-grid-lg`, `gap-grid-xl`, `gap-grid-xxl`). Use these only inside CSS grids; they track the same progression but stage larger leaps for multi-column layouts.
- Control spacing for UI elements (buttons, inputs) comes from the control scale (`px-control-sm`/`py-control-*`). Reach for these when adjusting individual form controls or icon buttons.
- Section Settings exposes independent padding controls for top, right, bottom, and left (presented inline at 25% width each). Keep `px-section-x` and `py-section-y` as the baseline, then override individual sides with the generated utilities (`pt-section-sm`, `pb-section-none`, `pl-section-xs`, `pr-section-lg`). Avoid ad hoc `mt-*`/`mb-*` spacing on children.
- Section padding also has a full scale (`px-section-none`, `px-section-xs`, `px-section-sm`, `px-section-lg`, `px-section-xl`, plus matching `py-section-*` variants). Only toggle these via Section Settings so the vertical rhythm remains consistent across the site.
- Use the container offset helpers (`pl-container-offset`, `pr-container-offset`, and their `-md`/`-sm` variants) when you need full-bleed elements to align with the container gutters.
- Treat Section Settings as client/editor overrides. When building a section, assume the defaults (standard container, light scheme, baseline padding) unless a user story explicitly requires exposing additional toggles or changing the defaults via schema.
- When mixing grids and flex layouts, align gap tokens with the underlying display type (grid → `gap-grid`, flex → `gap-content`).
- Avoid manual margins between siblings. Let the parent flex/grid gap control spacing.

### 6. Typography and Rich Text

- Use semantic tags (`h1`–`h6`, `p`, `ul`) and allow the global typography sheet to style them.
- Default to the design-system tokens; the most common overrides you will apply are size (`text-sm`, `text-lg`, `leading-relaxed`) and colour (`text-body`, `text-muted`). If a stakeholder explicitly requests something extra—such as bumping weight to `font-semibold`—honour the brief with the nearest token and avoid adding unsolicited embellishments.
- Utility overrides must come from the generated scale (`text-sm`, `leading-snug`, `font-semibold`), never custom pixel values.
- Rich text payloads must render through the shared `<RichText>` component with `enableGutter` and `className` overrides instead of ad hoc `dangerouslySetInnerHTML`.
- Pre-headings, legal copy, captions, and metadata use the body scale tokens and simple utilities (uppercase, tracking). Avoid one-off custom classes like bespoke `.text-preheading`.

### 7. Colour, Themes, and Inversion

- Colour changes come from Section Settings (light, neutral, dark) or parent-level CSS variables. Only apply manual colour utilities for edge cases (e.g. CTA button variants).
- To invert tone (e.g. light-on-dark), toggle Section Settings → colour scheme rather than sprinkling `text-white`/`bg-dark` in component markup.
- When a section needs accent colours beyond the neutral palette, use theme tokens (`text-primary-500`, `bg-secondary-100`). Introduce new tokens in `colors.css` before using raw hex values.
- Ensure every nested element—typography, buttons, badges, cards—derives its colours from the current scheme. Use semantic classes (`text-body`, `text-heading`, button variants tied to the palette) instead of hard-coded values so light/neutral/dark variants stay in sync.
- Some sections may only ever ship with a single colour treatment; in those cases you can keep one scheme and omit additional variants. Default to the shared schemes unless the design brief explicitly says a section is single-theme only.

### 8. Interactivity and Animations

- Confirm the desired motion strategy up front. Ask the requester (or inspect adjacent sections) to determine whether the project relies on global data attributes, bespoke GSAP timelines, or shared effects—then follow the same pattern unless you are explicitly asked to change it.
- **Global data attributes**: when Smart Site config enables global animations, add hooks once at the parent instead of scattering per-child delays.
  - Use `data-animate="fade-up"` + `data-animate-stagger`, and point `data-animate-target` (or `[data-animate-item]`) at the descendants you want to tween together.
  - Avoid assigning individual `data-animate-delay` values when a single stagger will do; it keeps the ScrollTrigger footprint lean and the markup clearer.
  - Other helpers (`data-parallax`, `data-rotate`, `data-typewriter`, `data-pulse`, `data-split`) follow the same pattern—apply to the element that conceptually owns the effect.
- Available global hooks (see `src/providers/gsap/global-animations.tsx` for options and defaults):

  | Hook | Purpose | Common attributes |
  | --- | --- | --- |
  | `data-animate` | Fade/slide on scroll | `data-animate-distance`, `data-animate-duration`, `data-animate-stagger`, `data-animate-target`, `data-animate-offset`, `data-animate-repeat` |
  | `data-parallax` | Scroll-tied parallax | `data-parallax-speed`, `data-parallax-start`, `data-parallax-end`, `data-parallax-scrub` |
  | `data-rotate` | Scroll-driven rotations | `data-rotate-turns`, `data-rotate-start`, `data-rotate-end`, `data-rotate-scrub` |
  | `data-typewriter` | Typewriter effect | `data-typewriter-speed`, `data-typewriter-delay`, `data-typewriter-ease`, `data-typewriter-start`, `data-typewriter-repeat` |
  | `data-pulse` | Looping pulse | `data-pulse-scale`, `data-pulse-duration` |
  | `data-split` | SplitText animations | `data-split` (`lines`/`words`/`chars`), `data-split-stagger`, `data-split-duration`, `data-split-ease`, `data-split-offset` |

- **Example – parent/child fade/stagger**

  ```tsx
  <div
    data-animate="fade-up"
    data-animate-distance="24"
    data-animate-stagger="0.1"
    data-animate-target="[data-animate-child]"
  >
    <h2 data-animate-child>Heading</h2>
    <p data-animate-child>Supporting copy</p>
    <div data-animate-child>Buttons…</div>
  </div>
  ```

- **Bespoke timelines with `useGSAP`**: for custom sequences, mark the component (or a nested helper) with `"use client"`, create a ref, and call `useGSAP` from `@/providers/gsap`. Scope animations with `gsap.context`, clean up on unmount, and reference the demo project (or your own prior implementations) for practical patterns.
- **Reusable GSAP effects**: place shared animations in `src/providers/gsap/effects.ts` (using `gsap.registerEffect`) so sections can call `gsap.effects.myEffect(targets, config)` without duplicating timelines. This keeps motion consistent across the catalogue.
- Keep third-party animation libraries out of sections. If you discover a missing helper, register it centrally in the GSAP provider rather than inlining it per section.

### 9. Accessibility and Semantics

- Maintain heading order relative to the page (no skipping levels). The hero typically renders the `h1`; subsequent sections should start at `h2`.
- Provide alt text through Media fields or computed fallbacks. Never leave background images without context if they convey information.
- Buttons/links from Payload should expose `aria-label` and `rel` attributes via the shared `CMSLink` component. Do not wrap block-level elements inside links unless the HTML specification allows it.
- Ensure interactive elements are keyboard reachable and visually focusable.

### 10. Data Safety and Performance

- Avoid heavy computations inside render. Pre-compute derived data at the top of the component.
- Lazy-load expensive subcomponents with `next/dynamic` if they introduce large bundles (e.g. charts, maps). Document the decision in the section README if you do.
- Do not fetch data directly within a section component. All data must come from the section props or shared loaders.

### 11. Review Checklist Before Shipping

- [ ] Folder and files follow naming contract (`kebab-case`, `config.ts`, `Component.tsx`).
- [ ] `config.ts` imports shared field presets and ends with `sectionSettings()`.
- [ ] Component wraps content with `<Section>` and uses container/gap/typography tokens only.
- [ ] Optional data guarded; no empty wrappers rendered when fields are blank.
- [ ] Animations use shared provider or declarative attributes; `"use client"` only when required.
- [ ] Accessibility reviewed (heading levels, alt text, focus states).
- [ ] Section registered in both `sections/config.ts` and `sections-map.tsx`.
- [ ] Storybook or catalogue preview (blocks library) updated if the section is installable.
- [ ] Manual QA on default, min, and max viewport widths to confirm fluid type/spacing behaves.

### 12. Coordination with the Blocks Library

- When promoting a section to the public catalogue, mirror the Smart Site folder into the Blocks Library repository (`src/registry/sections/<name>/`) without diverging token usage.
- Provide preview fixtures that use the same field schema so the catalogue renders accurately.
- Keep dependency metadata up-to-date (`packages/cli/src/registry/sections.ts`) so the CLI installs required fields, animations, and utilities.

### 13. Evolving the Guidelines

- ESLint enforces the key violations automatically. When the linter flags classes such as `bg-white`, `text-dark-500`, `tracking-[...]`, or the presence of a top-level `"use client"` directive, refactor the section to rely on the shared tokens or split the interactive code into `client.tsx`. Use `// smartsite-allow-client` in the rare cases where a section must remain entirely client-side.
- Any proposal to deviate from these rules must include:
  - A documented rationale (link to ADR or GitHub issue).
  - Updates to this guideline and the design system rules.
  - Communication to the team before merging.
- Treat this section as the source of truth. If you discover a helpful pattern while building sections, codify it here before rolling it out.

Adhering to this checklist guarantees that every Smart Site section is portable, composable, and ready for automation via the CLI. Break the rules only with explicit approval and documented trade-offs.
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
  admin: {
    meta: {
      title: "Admin | Smart Site",
      description: "Advanced admin panel",
      favicon: "/favicon.png",
    },
  },
  collections: {
    services: { enabled: false }, // example: hide services in this project
  },
  features: {
    ai: {
      enabled: true,
      endpoint: "https://smart-site-ai-core.vercel.app", // managed service (override only if Wild Creative provides a custom URL)
    },
    analytics: true,
    darkMode: false,
    i18n: false,
    search: true,
    sitemaps: true,
  },
  gsap: {
    scrollTrigger: true,
    scrollSmoother: true,
    splitText: false,
    globalAnimations: false,
  },
  extensions: {
    collections: [],
    blocks: [],
    globals: [],
    plugins: [],
  },
}

export default config
```

`features.ai.endpoint` defaults to the hosted Smart Site AI service (`https://smart-site-ai-core.vercel.app`). Only change this value if Wild Creative supplies a different managed endpoint.

### Default collections and extensions

Smart Site ships with a full set of first-party collections that already cover typical marketing needs. The defaults live in `src/admin/config/defaults.ts` (`SMARTSITE_DEFAULTS`) and every collection defined there starts with `enabled: true`. That means services, team, testimonials, templates, media, categories, pages, and posts are available the moment the app boots—you only need to touch `smartsite.config.ts` if you want to rename them, change SEO/front-end behaviour, or explicitly disable something.

- **System collections** (`uri-index`, `users`, `templates`) are always registered by the resolver in `src/admin/config/resolver.ts`, even if you try to disable them. They keep routing, authentication, and layout scaffolding intact.
- **Content collections** (`pages`, `posts`, `services`, `team`, `testimonials`, `categories`, `media`) stay on by default. Set `enabled: false` in `smartsite.config.ts` to hide one.
- **Extensions** are only for new slugs that do not exist in the default registry. Declare the slug in `smartsite.config.ts → extensions` and provide the actual config in `src/extensions`. Do **not** add built-in collections such as `services` or `testimonials` to extensions—they already exist.
- **Plugin collections** (`forms`, `form-submissions`, `redirects`, `search`, etc.) are installed automatically by the default plugin stack in `src/admin/payload/plugins`. They will appear in `payload-types.ts` without any manual configuration.
- **Search controls**: The same plugin stack registers the `search` collection when `features.search.enabled` is `true`. Configure the command palette vs. results page behaviour through `features.search.mode` (`"page" | "modal" | "hybrid"`). The collection is grouped under **Settings → Search Results** in Payload admin so reindexing and manual inspection stay tidy.

### Inspecting the active Payload configuration

1. Open `src/admin/config/defaults.ts` to see every baseline setting, including the default labels, SEO flags, sitemap weights, and feature toggles.
2. Review `src/smartsite.config.ts` for project-specific overrides—the file is merged deeply, so any key you omit uses the default above.
3. Check `src/extensions/index.ts` (and the folders it imports) to find custom collections/globals/blocks that replace or extend the defaults. The resolver automatically swaps them in when the slug matches.
4. Confirm the final build output in `src/admin/payload/payload-types.ts`. Payload regenerates this file on build and it lists every collection/global/block that is actually registered.

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
| `ai.endpoint` | `string`  | `https://smart-site-ai-core.vercel.app` | Managed AI backend URL (Wild Creative will advise if this needs to change)   |
| `darkMode`    | `boolean` | `false`          | Dark/light theme toggle                                                         |
| `i18n`        | `boolean` | `false`          | Internationalization                                                            |
| `analytics`   | `boolean` | `true`           | Analytics tracking                                                              |
| `search.enabled` | `boolean` | `true`       | Toggle the entire search stack (plugin registration, nav affordances, API)      |
| `search.mode` | `"page" \| "modal" \| "hybrid"` | `"hybrid"` | Choose between full results page, command palette, or both                    |
| `sitemaps`    | `boolean` | `true`           | XML sitemap generation                                                          |

#### GSAP Configuration

| Option              | Type       | Default | Purpose                                                                  |
| ------------------- | ---------- | ------- | ------------------------------------------------------------------------ |
| `scrollTrigger`     | `boolean`  | `true`  | Registers `ScrollTrigger` for manual hooks and global animations         |
| `scrollSmoother`    | `boolean`  | `true`  | Enables smooth scrolling context                                         |
| `flip`              | `boolean`  | `false` | Loads GSAP Flip plugin                                                   |
| `draggable`         | `boolean`  | `false` | Loads Draggable plugin                                                   |
| `morphSVG`          | `boolean`  | `false` | Loads MorphSVG plugin                                                    |
| `drawSVG`           | `boolean`  | `false` | Loads DrawSVG plugin                                                     |
| `splitText`         | `boolean`  | `false` | Registers SplitText for manual hooks                                     |
| `customEase`        | `boolean`  | `false` | Loads CustomEase                                                         |
| `physics2D`         | `boolean`  | `false` | Loads Physics2D helpers                                                  |
| `textPlugin`        | `boolean`  | `false` | Registers TextPlugin for manual hooks                                    |
| `globalAnimations`  | `boolean`  | `false`  | Enables the global data-attribute animation provider                    |

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
4. **Style with Tailwind v4** - Use design tokens from `spacing.css`, `colors.css`, and `typography.css`
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
| **Quick animations**  | Data attributes (`data-animate`, etc.) | Enable `gsap.globalAnimations` in config |

### Common Imports & Helpers

| Module | Exports | Notes |
| --- | --- | --- |
| `@/admin/cache` | `cache.getByURI`, `cache.getCollection`, `cache.getGlobal`, revalidation helpers (`revalidate`, `batchRevalidate`, `revalidateGlobal`, etc.) | Unified caching + invalidation API used across sections and API routes. |
| `@/admin/data/posts` | `getPostsWithPagination`, `getRecentPosts`, `getRelatedPosts` | Prebuilt queries for post listings and related posts. |
| `@/admin/data/globals` | `getGlobal`, `getSettings`, `getHomepage` | Fetches globals and resolves the homepage page doc. |
| `@/admin/data/user` | `getCurrentUser` | Reads the authenticated Payload user (for gating UI). |
| `@/components/ui/*` | Buttons, cards, breadcrumb primitives, command palette utilities | Shared UI primitives wired to design tokens. |
| `@/components/fields/*` | `link`, `buttonsGroup`, `sectionCta`, `sectionIntro`, etc. | Field builders used in section configs. |
| `@/admin/components/render-sections` | `PageData`, `RenderSections` | Context props injected into every section component. |

### Development Commands

```bash
# Start development
pnpm dev                # Main dev server

# Database management
pnpm db:schema         # Regenerate database schema
pnpm seed              # Seed with sample data

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
| **AI chat not working**      | Email andrew@wildcreative.com.au—backend uptime is managed by Wild Creative |
| **Lost AI credentials**      | Coordinate with Wild Creative, then run `pnpm smartsite ai rotate --force` and restart |

### Debug Commands

```bash
# Check database connection
PAYLOAD_CONFIG_PATH=./src/admin/payload/payload.config.ts pnpm exec payload migrate:status

# Regenerate URI index
pnpm regenerate-uris

# Reset everything
pnpm db:schema
pnpm seed

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
   - Provision a MongoDB Atlas cluster (Serverless or Dedicated) and create a database user.
   - Whitelist Vercel IPs or use the Atlas “Allow access from anywhere” option during setup.
   - Enable Vercel Blob and generate a Read/Write token.
   - Copy the Atlas SRV URI (`DATABASE_URL`) and Blob token (`BLOB_READ_WRITE_TOKEN`) into your Vercel environment variables.

4. **Advanced Settings**
   - Enable **Function Regions** (Sydney for AU/NZ projects)
   - Enable **Fluid Compute** for better performance
   - Consider **Standard CPU** for paid plans

### AI Backend Deployment

The Smart Site AI backend is operated entirely by Wild Creative. There are no deployment steps for clients—Wild Creative provisions, maintains, and secures the AI platform. Once your seed completes, contact andrew@wildcreative.com.au to have your workspace activated (a self-serve approval flow is being rolled out). For upgrades, regional routing, or incident support, email the same address.

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

#### AI Backend (Managed by Wild Creative)

- [ ] Subscription confirmed with Wild Creative
- [ ] AI workspace approved by Wild Creative (contact andrew@wildcreative.com.au)
- [ ] `AI_AGENT_API_KEY` generated after seeding
- [ ] Connection test completed (admin chat assistant responding)
- [ ] Support contact: andrew@wildcreative.com.au documented for the team

> **🚀 Production Seeding:** Remember to seed your production database after deployment using the same `/api/seed` endpoint or by running `pnpm seed` in your production environment.

---

<a id="staging-environments"></a>
## 🧪 Staging Environments

- **Optional (advanced teams only)**: enable staging when you need a dedicated Atlas cluster for QA. Skip this section unless you have a formal promote workflow.
- **Purpose**: Maintain a clean separation between production (`DATABASE_URL`) and any staging cluster referenced via `STAGING_DATABASE_URL` while you harden new features.
- **Automatic selection**: Whenever `STAGING_DATABASE_URL` is defined, development servers and preview deploys fall back to staging automatically. Override the behaviour explicitly with `SMARTSITE_DATABASE_TARGET=staging` or `SMARTSITE_DATABASE_TARGET=prod`.
- **Sync commands**: `pnpm smartsite staging pull` copies production content into staging; `pnpm smartsite staging push` promotes staging back to production. Both commands require the MongoDB Database Tools (`mongodump`, `mongorestore`) to be installed locally.
- **Protection rules**: Default exclusions (users, submissions, `payload-*` collections) live in `staging-sync.config.json`. Extend that file per client to prevent accidental overwrites of operational data.
- **Portable workflow**: The helper script (`scripts/db/staging-sync.mjs`) ships with Smart Site and is copied to the Starter and client repos during sync, ensuring every exported site keeps the same commands.

---

<a id="additional-resources"></a>
## 📖 Additional Resources

- **[Payload CMS Documentation](https://payloadcms.com/docs)**
- **[Next.js 16 Documentation](https://nextjs.org/docs)**
- **[Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)**
- **[GSAP Documentation](https://greensock.com/docs/)**
- **[Mastra AI Documentation](https://mastra.ai/docs)**
- **[Smart Site AI Backend](../smart-site-ai/README.md)** *(Wild Creative internal operations reference)*

<a id="contributing"></a>
## 🤝 Contributing

This is an internal tool for rapid website development. For questions or improvements, consult the development team.

<a id="license"></a>
## 📄 License

MIT License - See LICENSE file for details.


## Search Experience

### Feature Overview

- **Payload Search Plugin**: The starter wires `@payloadcms/plugin-search` through `src/admin/payload/plugins/index.ts`. It syncs every front-end collection and maintains a dedicated `search` collection that the frontend queries.
- **Config-driven toggle**: Enable or disable search (and choose modal/page/hybrid modes) from `src/smartsite.config.ts`. The feature integrates with the navigation components, the `/search` results page, and the command palette.
- **Realtime command palette**: A client-side modal (⌘/Ctrl + K) fetches results from `/api/search?q=…` and runs lightweight fuzzy scoring before grouping by collection label.
- **Server-rendered results page**: `/search` swaps between an SEO-friendly results screen or redirects to the command palette depending on the configured mode.

### Data Flow

1. **Index population**  
   - When a document is created or updated in a front-end collection, the search plugin’s `beforeSyncWithSearch` hook flattens key metadata (slug, URI, meta fields, categories) and populates the search record.  
   - `searchText` accumulates all relevant terms so the frontend can perform case-insensitive `contains` queries without a heavy database index.

2. **Fetching results**  
   - Server requests use `getSearchResults` (`src/admin/data/search.ts`), which calls the universal cache helper (`cache.getCollectionWithPagination`) to query the `search` collection with `contains` filters.  
   - The API route (`src/app/(frontend)/api/search/route.ts`) returns JSON for the command palette, and the `/search/page.tsx` renders the same data on the server.

3. **Frontend rendering**  
   - The command palette (`src/components/search/search-dialog.tsx`) manages modal state, debounces input, fetches JSON, and groups results by collection label.  
   - The classic results page uses the same helper but renders cards with pagination and search form controls.

### Configuration

```ts
// src/smartsite.config.ts
features: {
  search: {
    enabled: true,
    mode: "hybrid", // "page" | "modal" | "hybrid"
  },
}
```

- `enabled`: toggles the entire search stack. When `false`, the plugin isn’t registered, navigation hides search affordances, and the `/search` route returns 404.
- `mode`:  
  - `page` – only the server-rendered results page is available.  
  - `modal` – only the command palette is exposed.  
  - `hybrid` – both are available; the palette offers a “View all results” action.

### Maintenance & Troubleshooting

- **Reindexing**: The plugin exposes `/api/search/reindex` (requires admin auth) and a UI action inside the Payload admin. Running it rebuilds every search document using the current schema and hook logic.
- **Extending search fields**: Add fields to `searchFields` (`src/admin/payload/search/fieldOverrides.ts`) and enrich `searchText` in `beforeSyncWithSearch`.
- **Custom front-end collections**: Any collection marked `frontend: true` in the config is automatically indexed and exposed to search. Use `frontendOptions` to adjust defaults without touching the plugin.
- **Debugging**: The API route logs request parameters and response counts via `[search-api]` messages. Inspect the `search` collection directly in Payload admin to verify stored records.

By relying on the underlying search collection instead of scanning live content, the system delivers consistent performance, keeps the modal snappy, and ensures that both the command palette and server-rendered pages stay in sync with published content.
