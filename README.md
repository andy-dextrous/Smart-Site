# Smart Site - Enterprise Website Builder

A **field-driven, section-first website builder** powered by **Next.js 15**, **Payload CMS 3**, **Tailwind CSS v4**, **GSAP**, and **AI integration via Mastra**, designed for rapid development of dynamic websites with enterprise-grade features.

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

1. Open `.env.example` and, if your team has an active Smart Site AI subscription, request the `SMARTSITE_AI_REGISTRATION_SECRET` from Wild Creative (andrew@wildcreative.com.au) and paste it in. Leave the field blank if you are not connecting to the managed AI service. Every other key will be filled in by the setup script.
2. Run the interactive bootstrap:

   ```bash
   pnpm run setup
   ```

   The wizard copies `.env.example` to `.env`, generates secrets, collects database/storage/admin details, seeds demo data, and can leave `pnpm dev` running when it finishes.

### 2. Environment Configuration

> 💡 **Quick start**: Once the registration secret is set, `pnpm run setup` handles `.env` creation, secret generation, database/storage selection, admin credentials, optional seeding, and can leave the dev server running when it finishes.
>
> ⚠️ Use only the `SMARTSITE_AI_REGISTRATION_SECRET` issued by Wild Creative. Without an issued secret the wizard skips AI registration and the site operates without AI features.

The setup script writes these values into `.env`; use this reference when updating keys manually or configuring CI pipelines:

```bash
# Core Configuration
NODE_ENV=development
NEXT_PUBLIC_URL=http://localhost:3000
PAYLOAD_CONFIG_PATH=./src/admin/payload/payload.config.ts

# Database
DATABASE_PROVIDER=mongoose
DATABASE_URL=mongodb://127.0.0.1:27017/smart-site-dev

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
# OPENAI_API_KEY=sk-...                           # If using AI features
SMARTSITE_AI_REGISTRATION_SECRET=<registration-token>

# AI Agent (auto-generated after seeding)
AI_AGENT_API_KEY=
AI_AGENT_USER_ID=

# Admin Seeding (Development)
PAYLOAD_ADMIN_EMAIL=admin@example.com
PAYLOAD_ADMIN_PASSWORD=SecurePassword123!
```

#### AI Environment Variables

- `SMARTSITE_AI_REGISTRATION_SECRET` — subscription credential issued directly by Wild Creative. Contact andrew@wildcreative.com.au to obtain or rotate the value. Without this key the site remains disconnected from the managed AI platform.
- `AI_AGENT_API_KEY` — generated automatically during seeding once the registration secret is present. This key identifies your site to the managed backend; store it securely and never share it outside your organization.
- `AI_AGENT_USER_ID` — auto-generated identifier paired with the API key. It scopes every AI request to your tenant on the managed service.

> Rerun the seed if `.env` ever loses the agent credentials. The script reconciles the database user and restores the values without regenerating keys unless a rotation flow is requested.

### 3. Database Setup

Smart Site runs on MongoDB in every environment. PostgreSQL drivers remain in the repository for compatibility with legacy tooling, but the canonical configuration sets `DATABASE_PROVIDER=mongoose` and points `DATABASE_URL` at a MongoDB deployment.

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
- The seed scripts create collections automatically; Compass will list them after the first request to `/api/seed` or after running `pnpm seed:minimal`.

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

Run seeding (`pnpm seed:minimal` or `pnpm seed:demo`) only against development databases. Once a staging or production environment is active, use the promote flow above or Payload admin exports to transfer content.

### 4. AI Backend Setup

Smart Site runs standalone out of the box. To enable AI features you connect to the managed Smart Site AI platform operated by Wild Creative. There is no customer-managed installation step—simply request access via andrew@wildcreative.com.au and add the supplied registration secret to your `.env` file before seeding.

### 5. Development Server

```bash
# Start development server
pnpm dev
```

### 6. Database Seeding & Initial Setup

> **🗃️ Important:** The setup wizard seeds the minimal profile for you. Use the commands below only when you need to reseed or switch profiles.

`pnpm run setup` already seeds the **minimal** profile so you can start building immediately. Rerun the seed only after intentionally wiping the database.

#### Reseeding from the command line

1. Ensure the dev server is running (`pnpm dev`).
2. Run the seeding script (defaults to the minimal profile):

   ```bash
   pnpm seed
   ```

   Use `pnpm seed:demo` when you intentionally need the rich demo dataset. The script reads `SMARTSITE_SITE_NAME` so update `.env` before seeding if you want different registration metadata.

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
- **Global settings** preconfigured with site name/description, SEO defaults (including robots.txt), and routing that points the homepage field at the seeded Home page. Social links, locations, analytics IDs, and templates are intentionally left blank for you to fill in.

Run the **demo** profile when you want a fully populated showcase—posts, services, testimonials, media, templates, and expanded navigation are all included in that variant.

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
│   │   │       ├── theme.css             # Design tokens
│   │   │       └── typography.css        # Typography system
│   │   └── (payload)/                    # 🔐 Admin panel routes
│   │       ├── admin/                    # Payload admin UI
│   │       └── api/                      # CMS API endpoints
│   │
│   ├── components/                       # 🎨 Frontend components
│   │   ├── sections/                     # 📦 Sections you install or create (starter ships empty)
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

### Initial Registration Flow

1. Confirm `features.ai.enabled` is set to `true` in `src/smartsite.config.ts` and that the `SMARTSITE_AI_REGISTRATION_SECRET` in `.env` matches the subscription credential provided by Wild Creative. Do not modify the default endpoint unless the Wild Creative team supplies an alternative.
2. Run the standard seed flow (`pnpm seed`, the `/api/seed` endpoint, or the interactive setup script). During seeding the hidden `ai-agent` user is ensured, the site is registered with Smart Site AI, and `AI_AGENT_API_KEY` / `AI_AGENT_USER_ID` are written to `.env`.
3. Restart Smart Site so the updated environment variables are loaded.

After this handshake the admin chat assistant and other AI features can reach the managed backend immediately. If anything fails during registration, email andrew@wildcreative.com.au for support—there is no customer-side troubleshooting beyond verifying the secret and rerunning the seed.

### Regenerating Credentials Later

If a key is lost—or you want to rotate it without touching content—contact Wild Creative first, then run:

```bash
pnpm ai:register         # Sync existing credentials with the managed service
pnpm ai:register --force # Issue a brand-new API key (coordinate with Wild Creative before executing)
```

The command reuses the existing AI agent, updates Smart Site AI, and rewrites the `.env` entries in-place.

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

#### How Authentication Works

1. **AI Agent User**: Each Smart Site instance has a hidden user with role `ai-agent`
2. **API Key Generation**: This user has an API key (64-character hex string) for authentication
3. **Auto-Creation**: The AI agent is automatically created during database seeding
4. **Environment Storage**: Credentials are saved to `.env` (rerunnable with `pnpm ai:register`):

```bash
# AI Agent Configuration (Auto-generated example)
AI_AGENT_API_KEY=80fda7460be5a83e4dc8256392bba4baacdd48777fd5eb1bdd13a1c1b9a25375
AI_AGENT_USER_ID=68c0ba9971ba48af9e63f160
```

> When the Wild Creative-issued `SMARTSITE_AI_REGISTRATION_SECRET` is present, the seeding step registers your site with the managed Smart Site AI platform, prints an audit fingerprint, and returns a single-use recovery token. Store that token securely—the platform cannot reissue it without manual intervention from Wild Creative.

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
    "X-Site-ID": AI_AGENT_USER_ID,
    "X-Site-URL": NEXT_PUBLIC_URL,
  },
})
```

#### End-to-End Request Flow

1. Frontend API routes under `app/(frontend)/api/ai/*` validate the shared secret, add the `X-Site-ID` header, and proxy requests to the Mastra backend.
2. The managed Smart Site AI backend operated by Wild Creative verifies the site ID/API key pair, loads the correct workspace, and runs the requested chat/thread/schema operation.
3. Responses stream back through the proxy so the admin chat panel and public endpoints never expose Mastra credentials directly.
4. `ensureAIAgentWithAPIKey` keeps the Payload AI agent user and `.env` credentials synchronized during seeding, preserving a single Smart Site identity; you can rerun this logic later via `pnpm ai:register` (add `--force` to rotate the key).

> Backend provisioning is handled entirely by Wild Creative. If you need to confirm connectivity or request changes, email andrew@wildcreative.com.au rather than attempting to deploy your own instance.

#### Security Features

- **Hidden User**: AI agent never appears in admin UI
- **Encrypted Storage**: API keys are encrypted in database using `PAYLOAD_SECRET`
- **One-Time Display**: API key shown only during creation
- **Role Isolation**: `ai-agent` role has specific access patterns
- **Multi-Tenant Ready**: Each site has unique credentials

<a id="design-system"></a>
## 🎨 Design System

Smart Site inherits the universal design system defined in `src/app/(frontend)/css`. These tokens mirror the Smart Site Starter, so the same spacing rhythm and color palette apply across every project.

### Token Sources
- `theme.css` declares all spacing clamps, container widths, navigation offsets, and the shared color palette.
- `base.css` applies global section padding (`px-section-x py-section-y`), sets the default background/text colors, and seeds border styling.
- `typography.css` defines the fluid type scale, heading hierarchy, and default link treatments. Avoid reapplying these inside sections unless you are building an intentional variant.
- `utilities.css` exposes container helpers (`container`, `container-md`, `container-sm`) that wrap the matching `max-w-*` tokens.

### Spacing System
- **Section rhythm**: Each `<section>` automatically receives the global horizontal and vertical padding together with positioning defaults. Reach for the section scale tokens only when a block needs intentionally tighter or looser vertical rhythm.
- **Navigation offsets**: Apply the first-section offset token to clear the fixed header, and use the navigation-spacing variables on overlays that sit inside the hero grid.
- **Containers & gutters**: The container tokens clamp readable widths, while the offset variables let full-bleed surfaces align their inner content back to the grid.
- **Interior spacing**: The content spacing tokens control gaps between stacked elements and the inset padding inside cards or callouts. Prefer these over bespoke values to stay on the shared rhythm.

### Color Palette
- **Primary** tokens define the dominant brand hue used for key actions, emphasis, and interactive states.
- **Secondary** tokens supply a complementary accent for supporting highlights, gradients, or secondary CTAs.
- **Neutral** tokens provide the light gray base for subtle backgrounds and dividers, while the **dark** scale spans text, elevated surfaces, and inverted sections.
- **Role-based** tokens give you consistent border, form-outline, and translucent treatments without relying on ad-hoc opacity adjustments.

### Usage Guidelines
- Lean on the defaults from `base.css` and `typography.css`; stacking additional padding or text utilities on top of them typically doubles spacing or breaks the type scale.
- Compose new sections with the shared building blocks so spacing and color tokens are applied consistently for you.
- Reference the design system variables through the provided utilities rather than hard-coding values; this keeps Smart Site and the Starter aligned.

<a id="settings"></a>
## 🛠 Settings

Smart Site exposes multiple globals to keep site-wide controls inside the admin:

- **Header** (`src/admin/payload/globals/header/config.ts`): Manage navigation structure, dropdowns, and nested submenus. Update this when menus change—do not hard-code links in layout components.
- **Footer** (`src/admin/payload/globals/footer/config.ts`): Configure footer menus and legal links. This is the canonical source for footer navigation, so editors can reorder or rename links without code deployments.
- **Settings** (`src/admin/payload/globals/settings/index.ts`): Owns brand text, location data, routing defaults, SEO fallbacks, and integrations. Because this document is fetched on every request, treat it as the definitive place to toggle site-wide behaviour.
- **AI Settings** (`src/admin/payload/globals/ai-settings/index.ts`): Stores AI feature switches and credentials when the Mastra backend is active.

### When to use Settings vs. other configuration

- Use **Settings** for anything editorial teams must control live—branding text, social links, analytics IDs, archive/template relationships, search-engine verification, robots toggles, or the first-section nav offset logic driven by routing.
- Use **Header**/**Footer** for navigation updates. They feed directly into frontend components and trigger cache revalidation through their `afterChange` hooks.
- Use `src/smartsite.config.ts` for developer-level feature flags (enabling collections, turning on GSAP modules, selecting storage providers). These values require a redeploy and are not meant for editors.
- Create purpose-built globals/collections when a client needs custom data structures (e.g., testimonials, pricing matrices). Keep Settings focused on foundational behaviour.

### Settings tabs at a glance
- **General**: `siteName` and `siteDescription` power branding text and default metadata. Adjust when the company name or positioning changes.
- **Social Media**: Manage outbound profile URLs in one place. Header/footer components consume this array directly.
- **Locations**: Maintain office/contact entries with coordinates. Map-based sections and structured data use this list, so prefer updating here instead of editing components.
- **Routing**: Assign the homepage, default page template, collection archive pages, and per-collection single templates. Changing these triggers revalidation and updates the auto-apply template logic.
- **SEO**: Set default meta imagery, favicons, organisation schema, and verification codes. Use the robots controls to block staging instances from crawlers.
- **Social Defaults**: Provide fallback Open Graph/Twitter assets and handles when individual entries lack overrides.
- **Integrations**: Paste analytics IDs or trusted embeds into `<head>`/`<body>` slots without touching code.

All of these updates should go through the admin. The `afterSettingsChange`, `afterHeaderChange`, and `afterFooterChange` hooks handle cache invalidation, template dependency jobs, and navigation refreshes; bypassing the UI skips those guarantees.

<a id="templates"></a>
## 🧩 Templates

Templates are editorial building blocks that capture reusable section stacks. The philosophy is: **codify layout intent once, let editors apply it repeatedly without duplicating effort.**

- **Where they live**: `src/admin/payload/collections/templates.ts` defines the collection. Each template includes a name, an optional description (help text for editors), and a required list of section blocks.
- **How they are used**:
  - **Automatic**: In Settings → Routing, set `Default Page Template` or a collection-specific `Single Template`. When an editor creates a new entry for those collections and leaves sections empty, the `applyDefaultTemplate` hook clones that template into the document.
  - **Manual**: Section-based collections expose an **Apply Template** field in the sidebar (rendered by `assign-template`). Selecting a template replaces the current section list, keeping block order and default props intact.
- **When to create a template**: Any time a layout repeats across entries—service details, product landers, sub-brand homepages, campaign microsites. One-off hero compositions or experimental pages can remain freeform sections instead.
- **Maintenance**: Editing a template does not overwrite customised pages. After changing a template, ask editors to reapply it where necessary; the dependency job invalidates caches so previews stay fresh but respects per-page tweaks.

Keep templates lean—avoid hard-coded copy, and use placeholder text that nudges editors toward the intended structure. This keeps them flexible while still enforcing layout standards.

<a id="building-sections"></a>
## 📦 Building Sections

Sections are the **core building blocks** of Smart Site. Start with a blank canvas, install audited patterns from the Smart Site Sections Library, or craft bespoke sections in this directory. Each section is a self-contained unit with its own fields and component.

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
import { link } from "@/components/fields/link/link"
import { sectionCta } from "@/components/fields/section-cta/section-cta"

export const HeroBanner: Block = {
  slug: "hero-banner",
  interfaceName: "HeroBannerBlock",
  fields: [
    link(), // Smart link selector
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
import { CMSLink } from "@/components/fields/link"
import { SectionCta } from "@/components/fields/section-cta"
import { Media } from "@/components/fields/media"
import type { HeroBannerBlock } from "@/admin/payload/payload-types"

export function HeroBannerComponent({
  link,
  sectionCta,
  backgroundImage
}: HeroBannerBlock) {
  return (
    <section className="relative min-h-screen">
      {backgroundImage && <Media resource={backgroundImage} />}
      {link?.label && (
        <CMSLink
          newTab={link.newTab ?? undefined}
          reference={link.reference ?? undefined}
          type={link.type ?? undefined}
          url={link.url ?? undefined}
        >
          {link.label}
        </CMSLink>
      )}
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
- **Animations**: mark animated components with `"use client"`, import `useGSAP`/`gsap` from `@/providers/gsap`, scope the animation with a ref, animate transforms/opacity, add `will-change` classes when animating, and toggle `gsap.globalAnimations` when you prefer drop-in data-attribute reveals.
- **Typography & padding**: lean on the design system for spacing (`px-section-x`, `py-section-y`, `gap-content`) and type instead of adding ad-hoc `p-*`, `text-*`, or `leading-*` utilities inside components.
- **Styling workflow**: check `components.css` for reusable patterns before layering custom Tailwind values; only add new classes there when the pattern will be reused.

### Adding Animations

High-contrast motion is part of the Smart Site DNA. Pick the right layer for the job so pages stay maintainable and performant.

#### 1. Quick presets (config-driven)

- Toggle `gsap.globalAnimations` in `smartsite.config.ts` when editors just need tasteful reveals.
- Add data attributes directly to markup – no custom hooks required:

  ```tsx
  <div data-animate="fade-up" data-animate-delay="0.2">
    <h2 className="font-display text-balance">Heading that glides in</h2>
  </div>
  ```

| Effect        | Attribute(s)                                                                                                      | Notes |
| ------------- | ------------------------------------------------------------------------------------------------------------------ | ----- |
| Fade + offset | `data-animate="fade-up\|fade-down\|fade-left\|fade-right\|fade-in"`, `data-animate-duration`, `data-animate-delay`, `data-animate-distance`, `data-animate-offset`, `data-animate-stagger`, `data-animate-target`, `data-animate-repeat` | Uses `ScrollTrigger`. Repeats when `data-animate-repeat="true"`.
| Parallax      | `data-parallax`, `data-parallax-speed`, `data-parallax-start`, `data-parallax-end`, `data-parallax-scrub`          | Vertical translate tied to scroll. |
| Rotate        | `data-rotate`, `data-rotate-turns`, `data-rotate-start`, `data-rotate-end`, `data-rotate-scrub`                    | Continuous scroll-based rotations. |
| Typewriter    | `data-typewriter`, `data-typewriter-speed`, `data-typewriter-delay`, `data-typewriter-ease`, `data-typewriter-start`, `data-typewriter-repeat` | TextPlugin loads automatically when needed. |
| Pulse         | `data-pulse`, `data-pulse-scale`, `data-pulse-duration`                                                            | Idle breathing animation (no ScrollTrigger required). |
| Split text    | `data-split="lines\|words\|chars"`, `data-split-stagger`, `data-split-duration`, `data-split-offset`, `data-split-ease` | SplitText loads on demand and runs once per page load. |

#### 2. Section-level timelines

- Reach for bespoke timelines when motion depends on component state or complex sequencing.
- Import from the provider so GSAP plugins respect config toggles:

  ```tsx
  "use client"

  import { useRef } from "react"
  import { gsap, useGSAP } from "@/providers/gsap"

  export function FeatureRow() {
    const scope = useRef<HTMLDivElement>(null)

    useGSAP(() => {
      const items = gsap.utils.toArray<HTMLElement>('[data-feature]', scope.current)
      gsap.from(items, {
        opacity: 0,
        y: 24,
        stagger: 0.12,
        duration: 0.6,
        ease: "power2.out",
      })
    }, { scope })

    return (
      <div ref={scope}>
        {/* ... */}
      </div>
    )
  }
  ```

#### 3. Custom GSAP effects

- Register reusable effects in `src/providers/gsap/effects.ts`.
- Keep project-specific effects in `src/providers/gsap/effects.ts` so teams can add branded motion without conflicts.

#### 4. Performance checklist

- Prefer transforms and opacity; avoid animating layout properties.
- Disable `gsap.globalAnimations` when a project only uses bespoke motion.
- Kill any manually created `ScrollTrigger` or timelines inside cleanup callbacks.
- Keep timelines scoped (`useGSAP` + refs) to prevent cross-page leaks.

### Reusable Field Patterns

Smart Site provides **pre-built field groups** that ensure consistency:

| Field Group          | Purpose            | Includes                        |
| -------------------- | ------------------ | ------------------------------- |
| `link()`             | Smart linking      | Internal/external/anchor        |
| `buttonsGroup()`     | Button clusters    | Array of buttons                |
| `button()`           | Single action      | Label, URL, variant             |
| `sectionCta()`       | Call-to-action bar | Button text, link, style        |
| `sectionIntro()`     | Optional heading   | Heading, description, alignment |
| `image()`            | Media upload       | Image-only upload field         |

Use only the helpers that fit a section’s content footprint—`sectionIntro()` is handy when you need a heading/eyebrow pair, but many sections can skip it entirely in favour of richer link or content fields.

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
| `search`      | `boolean` | `true`           | Search functionality                                                            |
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
| **Lost AI credentials**      | Coordinate with Wild Creative, then run `pnpm ai:register --force` and restart |

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
   - Configure Vercel Postgres in dashboard
   - Set up Vercel Blob for file storage
   - Copy connection strings to environment variables

4. **Advanced Settings**
   - Enable **Function Regions** (Sydney for AU/NZ projects)
   - Enable **Fluid Compute** for better performance
   - Consider **Standard CPU** for paid plans

### AI Backend Deployment

The Smart Site AI backend is operated entirely by Wild Creative. There are no deployment steps for clients—Wild Creative provisions, maintains, and secures the AI platform. To enable AI for your Smart Site instance, ensure your subscription is active and confirm the connection by seeding with the provided registration secret. For upgrades, regional routing, or incident support, email andrew@wildcreative.com.au.

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
- [ ] `SMARTSITE_AI_REGISTRATION_SECRET` provided by Wild Creative and stored in `.env`
- [ ] `AI_AGENT_API_KEY` / `AI_AGENT_USER_ID` generated after seeding
- [ ] Connection test completed (admin chat assistant responding)
- [ ] Support contact: andrew@wildcreative.com.au documented for the team

> **🚀 Production Seeding:** Remember to seed your production database after deployment using the same `/api/seed` endpoint or by running `pnpm seed` in your production environment.

---

<a id="staging-environments"></a>
## 🧪 Staging Environments

- **Purpose**: Maintain a clean separation between production (`DATABASE_URL`) and any staging cluster referenced via `STAGING_DATABASE_URL` while you harden new features.
- **Automatic selection**: Whenever `STAGING_DATABASE_URL` is defined, development servers and preview deploys fall back to staging automatically. Override the behaviour explicitly with `SMARTSITE_DATABASE_TARGET=staging` or `SMARTSITE_DATABASE_TARGET=prod`.
- **Sync commands**: `pnpm staging:pull` copies production content into staging; `pnpm staging:push` promotes staging back to production. Both commands require the MongoDB Database Tools (`mongodump`, `mongorestore`) to be installed locally.
- **Protection rules**: Default exclusions (users, submissions, `payload-*` collections) live in `staging-sync.config.json`. Extend that file per client to prevent accidental overwrites of operational data.
- **Portable workflow**: The helper script (`scripts/db/staging-sync.mjs`) ships with Smart Site and is copied to the Starter and client repos during sync, ensuring every exported site keeps the same commands.

---

<a id="additional-resources"></a>
## 📖 Additional Resources

- **[Payload CMS Documentation](https://payloadcms.com/docs)**
- **[Next.js 15 Documentation](https://nextjs.org/docs)**
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
