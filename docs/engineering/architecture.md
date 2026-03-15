# Architecture

## Design philosophy

Smart Site follows a field-driven, section-first architecture where:

- Fields drive everything.
- Sections are self-contained.
- Admin layer is protected.
- Configuration over modification.

## Technology stack

- Next.js 16 App Router
- Payload CMS 3
- Tailwind CSS v4
- GSAP
- Mastra-backed AI integration
- MongoDB for local, hosted, and self-hosted profiles

## Layer separation

| Layer | Location | Purpose | Modify? |
| --- | --- | --- | --- |
| Frontend | `src/components/`, `src/app/(frontend)/` | Public website | Yes |
| Admin | `src/admin/` | CMS core system | No, use config and extensions |
| Extensions | `src/extensions/` | User customizations | Yes |
| Config | `src/smartsite.config.ts` | System configuration | Yes |

## Admin layer

The `src/admin/` directory contains the core system that powers SmartSite.

- self-contained manifest
- source of updates
- configuration-driven customization
- CMS, routing, and caching logic

Source: [source-manuscript-readme.md](../references/source-manuscript-readme.md)

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
| **Database**  | MongoDB               | Content storage for local, hosted, and self-hosted profiles |
| **Storage**   | Local/Cloudinary/S3/Vercel Blob | Media file storage                     |
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
