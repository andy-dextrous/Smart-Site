# SmartSite — an AI-ready website builder with Next.js and Payload CMS

**Build a website by talking to your coding agent. Keep a full CMS, your source code, and control of your hosting.**

[![Latest release](https://img.shields.io/github/v/release/andy-dextrous/Smart-Site)](https://github.com/andy-dextrous/Smart-Site/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](package.json)
[![Payload CMS](https://img.shields.io/badge/Payload_CMS-3-black)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue)](tsconfig.json)

[**Use this template**](https://github.com/new?template_name=Smart-Site&template_owner=andy-dextrous) · [**Explore the Elvora demo**](https://ai-smart-site.vercel.app) · [**Read the docs**](docs/index.md) · [**Release notes**](https://github.com/andy-dextrous/Smart-Site/releases)

SmartSite is an open-source, standalone website-building kit for business websites, marketing sites, blogs and content-rich projects. It combines a Next.js frontend, Payload CMS, reusable sections, content templates, media management, search, SEO, forms, deployment tools and a development guide that travels with your repository.

Think of the familiar WordPress experience—pages, posts, media, menus and an editor—reimagined as a TypeScript application you can build with Codex or Claude Code. SmartSite is not a WordPress fork and does not run WordPress themes or plugins. Its extensibility comes from React components, Payload schemas and ordinary source code.

Payload provides the excellent CMS foundation. SmartSite adds an integrated site-building workflow around it: broader content models, shared page templates, routing, a customized admin, local database lifecycle, native MCP content access, and project-local agent skills. You start with a coherent application rather than assembling those pieces yourself.

## Contents

- [Why SmartSite?](#why-smartsite)
- [Try it in a conversation](#try-it-in-a-conversation)
- [What is included](#what-is-included)
- [The CMS and editorial experience](#the-cms-and-editorial-experience)
- [AI-assisted development and native MCP](#ai-assisted-development-and-native-mcp)
- [Quick start](#quick-start)
- [Build your first website](#build-your-first-website)
- [Customize and extend](#customize-and-extend)
- [Project structure](#project-structure)
- [Databases, media and integrations](#databases-media-and-integrations)
- [Deploy and maintain](#deploy-and-maintain)
- [Verification and everyday commands](#verification-and-everyday-commands)
- [Frequently asked questions](#frequently-asked-questions)
- [Documentation, contributions and credits](#documentation-contributions-and-credits)

## Why SmartSite?

### A website and its building kit, together

The repository includes the frontend, CMS, local components, setup helpers, documentation and skills. A fresh agent can discover how the site works from files inside the project. It does not need access to the private repository that originally produced the template, a component registry, or your previous conversations.

### Start blank, build something specific

Bootstrap creates the essentials needed to work: an owner account, settings, a local environment identity and an MCP connection. It does **not** fill your site with sample businesses, pretend testimonials, example blog posts or Elvora content. Your business facts, design and content belong to your project.

### Use conversation for development and a CMS for editing

Ask your agent to create a section, arrange a landing page, prepare an article or update navigation. Editors can also use the admin directly, without running an agent or buying a model API subscription. The same stored content powers both workflows.

### Keep control as the project grows

You get real React and TypeScript source, typed configuration and Payload extension points. Add a new content type, design a custom section or integrate another service without leaving the project. Managed hosting and a documented Docker/VPS route are available.

### Separate code delivery from content delivery

Publishing a code update should preserve production content. SmartSite documents environment identity, backups, deliberate first-launch transfer and targeted migrations so an agent has an established maintenance process to follow.

## Try it in a conversation

After creating your repository from the template, open it in Codex or Claude Code and say:

> Set up this SmartSite locally. Verify the app, admin and MCP connection, then help me build a website for my business.

Once it is running:

> Build a five-page website for our architecture studio. First help me clarify the audience, page structure and visual direction. Use the photographs I provide, leave unverified facts as questions, and show me the actual site in a browser.

Or, for an existing site:

> Draft a new service page using our existing design. Keep it unpublished, add it to the proposed navigation, and show me a preview before publishing anything.

These are example requests, not promises of unattended perfection. Your agent still needs working prerequisites, access to your chosen services and decisions about your business and publication. The kit gives it concrete workflows and verification steps.

## What is included

| Area | Included capability |
| --- | --- |
| Website application | Next.js App Router, React, TypeScript and Tailwind CSS |
| CMS | Payload admin with structured collections, rich-text editing and role-based access |
| Content | Pages, posts, services, team, testimonials, categories and media |
| Reusable layouts | Templates for content-driven routes, plus configurable page sections |
| Site structure | Header/footer globals, nested content support and a central URI index |
| Editorial workflow | Draft/publish behavior and versions on configured content types, preview and admin links |
| Media | Local uploads plus configurable Vercel Blob, S3, Cloudinary and UploadThing adapters |
| Forms | Payload form builder, submissions and configurable delivery |
| Search | Search indexing, results-page and command-palette modes |
| SEO | SEO fields, metadata infrastructure, redirects and sitemap generation |
| UI foundation | Local UI primitives, shared media/link/rich-text fields and section settings |
| Motion | Configurable GSAP support and shared animation conventions |
| Optional features | Dark mode, localization and analytics configuration |
| AI content access | Payload's official MCP plugin with four scoped SmartSite tools |
| Agent guidance | Matching Codex and Claude skills, project brief/design files and focused workflows |
| Local operation | Bootstrap, readiness checks and isolated app/database start/stop helpers |
| Deployment | Managed-host guidance and Docker/VPS deployment, backup and rollback tooling |
| Maintenance | Upgrade guidance, explicit content transfer and migration workflows |

Some capabilities need configuration, credentials, content or a custom frontend before they are useful. A feature being available does not mean every integration is enabled or fully configured in a fresh clone.

### Included sections and building blocks

The starter deliberately provides a compact set of editable sections:

- **Hero:** headline, supporting copy, media and calls to action.
- **Content:** editorial content and rich-text layouts.
- **Contact form:** a frontend connected to CMS-managed forms.
- **Posts archive:** an article listing.
- **Post hero, content and related posts:** reusable article-template building blocks.

Shared components handle section layout, links, buttons, media, rich text and common UI. Build new testimonial grids, pricing sections, service cards or other designs using the local section conventions. See the [component catalogue](docs/engineering/component-catalogue.md) and [section development guide](docs/engineering/section-development.md).

### The Elvora showcase

[Elvora](https://ai-smart-site.vercel.app) demonstrates what a customized SmartSite can become: a complete branded website with service pages, workshops, articles, team content and custom visual sections.

**The showcase is separate from this template.** Its branding, content, workshop extension, globe and custom designs are examples of site-specific work. They are not seeded into a new SmartSite, and the blank template does not depend on the showcase being online.

## The CMS and editorial experience

### Structured content that can be reused

Pages are composed from sections. Posts, services and team profiles have their own content models; templates determine how supported content is presented. Testimonials and categories are reusable content libraries. Media records hold uploaded assets and their descriptive information.

This keeps article copy separate from article layout. For example, create a post template containing the post hero, content and related-post sections, then assign it in routing settings. Changing the template can update the presentation across the associated articles.

### An admin for everyday work

Manage content at `/admin`. The interface brings content collections, site globals and operational settings together. API Keys live under **Settings**, with a key icon, alongside other configuration-oriented entries.

Access is controlled by CMS roles and collection/field permissions. Public readers see published content; authenticated editors can work on drafts where the content model supports them. Version history provides evidence for restoring selected content deliberately.

### Navigation, URLs and discovery

Header and footer content are managed as globals. A URI index connects public paths to the appropriate content and template. Search, redirects, SEO fields and sitemaps are integrated into the site foundation rather than left as unrelated starter exercises.

Changes still need editorial review: check actual URLs, navigation destinations, titles, descriptions and images before launch. A framework cannot supply your business's search strategy or guarantee rankings.

## AI-assisted development and native MCP

SmartSite uses **Payload's official `@payloadcms/plugin-mcp`** for the MCP endpoint and API-key authentication. SmartSite adds bounded content tools on that native transport. There is no separate legacy MCP server to run and no embedded AI chat application to configure.

Your coding agent uses normal file tools for source changes and MCP for supported CMS content. That distinction makes the stored website editable without pretending a source-code edit changes the database.

### Four focused content tools

| Tool | What it does |
| --- | --- |
| `smartsiteRead` | Discover the site's identity, content catalogue and schemas; find/read content and inspect history |
| `smartsiteSave` | Create or update one item with an explicit publication mode and revision checks |
| `smartsiteUploadMedia` | Upload PNG, JPEG or WebP image bytes with alt text, within the documented limits |
| `smartsiteOperationStatus` | Check the result of an operation after a lost response |

Content updates check the version the agent read. If another editor has changed the record, the agent must read and reconcile the change. Operation receipts make retries inspectable. Publishing is explicit for draft-capable content; changes to live-only globals take effect immediately.

Keys belong to a CMS user and have explicit tool grants. CMS access rules still apply. Accounts, API keys, private submissions and internal system records are not general content targets. The endpoint does not expose a shell or raw database console.

MCP image uploads currently support PNG/JPEG/WebP up to **2 MiB** and 40 million decoded pixels. Use the CMS or a reviewed storage migration for larger files and other formats. Read the [content workflow](docs/workflows/content-mcp.md) and [MCP contract](docs/engineering/mcp.md) for exact behavior.

### Skills that travel with your site

| Skill | Purpose |
| --- | --- |
| `smartsite-start` | Set up or resume the site and verify the connection |
| `smartsite-build` | Turn a brief into a coherent website |
| `smartsite-sections` | Add or change section schemas and renderers |
| `smartsite-content` | Read and edit stored content through MCP |
| `smartsite-data` | Extend collections and handle data changes |
| `smartsite-repair` | Diagnose failures using the actual environment |
| `smartsite-launch` | Prepare hosting, content transfer and launch verification |

Codex guidance lives in `.agents/skills/`; Claude guidance lives in `.claude/skills/`. Both have a root router—[AGENTS.md](AGENTS.md) and [CLAUDE.md](CLAUDE.md)—plus the same project documentation. A bundled Payload reference skill supports deeper CMS work.

Skills are instructions, not automatic permissions. Your client's project trust, tool approval and credential policies still apply. Other coding agents can read the Markdown workflows even when they do not support the same skill discovery mechanism.

## Quick start

### 1. Create your own repository

Choose [Use this template](https://github.com/new?template_name=Smart-Site&template_owner=andy-dextrous), create a repository and clone **your new repository**. Open that directory in your coding agent.

The result is a standalone application. It needs no parent monorepo, workspace packages or private registry.

### 2. Install the prerequisites

| Requirement | Supported target |
| --- | --- |
| Node.js | 24.22.1 or a newer Node 24 patch, as constrained by `package.json` |
| pnpm | 10.34.8, pinned in `packageManager` |
| MongoDB | An installed MongoDB 8 `mongod` binary |
| Agent | Codex or Claude Code for the guided conversational workflow; optional for manual development |

Use official packages for your operating system and architecture. Local startup creates its own authenticated, loopback-only MongoDB replica set. You do not need to start a shared Mongo service or create a hosted database account to begin.

Local lifecycle automation currently relies on `ps`; Windows lifecycle support is not yet certified. Read [getting started](docs/workflows/getting-started.md) for platform details and package-manager fallback instructions.

### 3. Ask the agent to set up the site

> Read the project instructions, install the pinned dependencies and bootstrap this site. Check the database, frontend, admin and the actual MCP connection. Then open the local site in an external browser.

The underlying commands are ordinary package scripts:

```bash
pnpm install --frozen-lockfile
pnpm bootstrap
pnpm doctor
```

There is **no global SmartSite CLI to install or learn**. These repository-local helpers remain available for agents and developers who want to run them directly.

Bootstrap generates private credentials and runtime state under ignored `.smartsite/` files. Each fresh clone receives its own site identity, database, ports and keys. Keep that private state out of Git and do not copy it into another clone.

### 4. Connect the client and begin

Reconnect the generated `smartsite` MCP server in your client and accept its project trust prompt when appropriate. Ask the agent to call `smartsiteRead` with `action: catalogue` and compare the returned identity with `doctor`.

A generated connection file alone is not proof that the client is connected. Once the tool call succeeds, build your first page and inspect the real result.

For later sessions:

```bash
pnpm doctor
pnpm local:start
# When finished:
pnpm local:stop
```

Stopping owned processes preserves content. Bootstrap can be rerun after fixing a reported problem; it preserves existing owner-edited settings and does not offer a destructive reset shortcut.

## Build your first website

1. **Define the brief.** Record audience, business facts, pages and goals in [the project brief](docs/project/brief.md).
2. **Choose the visual direction.** Record typography, color, spacing and references in [the design notes](docs/project/design.md).
3. **Build the smallest useful page.** Reuse existing sections, or create a local section when the design needs it.
4. **Add real content.** Use MCP for stored text, relationships, navigation and supported images. Review draft/public state.
5. **Check the actual site.** Inspect desktop and mobile layouts, links, forms, imagery and the admin editing experience.
6. **Launch deliberately.** Choose hosting, configure durable media and email, transfer approved content and verify the public URL.

Useful follow-up requests include:

> Add a testimonial section that matches our existing design. Use only the customer quotes I provide. Make its content editable in the CMS.

> Create a draft article from this text, choose our existing post template, and show me its preview.

> Diagnose why this image is missing. Check its CMS record, storage URL and frontend rendering before changing anything.

> Prepare this site for launch. Show me the destination, content scope, media storage, email behavior and rollback plan before making the final publication changes.

## Customize and extend

The main configuration file is [`src/smartsite.config.ts`](src/smartsite.config.ts). It controls site identity, collection options, feature switches, storage, animation and extensions.

A small example:

```ts
import type { UserConfig } from "@/admin/config/defaults"

const config: UserConfig = {
  identity: { siteName: "My Studio" },
  features: {
    search: { enabled: true, mode: "hybrid" },
    darkMode: false,
    i18n: false,
  },
}

export default config
```

Omitted settings inherit the core defaults. Use the actual configuration types as the reference when changing options.

- **New visual section:** add its schema and renderer using the section guide; reuse shared fields and layout conventions.
- **New content type:** define and register an extension, then enable its slug in configuration.
- **Existing built-in content:** configure the existing collection instead of registering a duplicate.
- **New MCP content target:** opt it in explicitly and review its access rules and exposed fields.
- **Site styling:** change your frontend components and design system rather than scattering overrides through the CMS core.

`src/admin/` is the shared SmartSite core boundary. Keep routine site customization in the frontend, configuration and extension surfaces so future core upgrades are easier to review. See [configuration](docs/engineering/configuration-system.md), [admin layer](docs/engineering/admin-layer.md) and [upgrades](docs/workflows/upgrading.md).

## Project structure

```text
.
├── AGENTS.md / CLAUDE.md       Agent entry points
├── .agents/skills/             Codex skills and Payload reference
├── .claude/skills/             Claude skills and Payload reference
├── src/
│   ├── app/                   Next.js routes and application entry points
│   ├── admin/                 Shared SmartSite CMS/core
│   ├── components/            Site sections, shared fields and UI
│   ├── extensions/            Site-specific Payload extensions
│   └── smartsite.config.ts    Site configuration
├── docs/                      Project brief, design and workflows
├── scripts/                   Local lifecycle and operational helpers
├── tests/                     Unit and disposable integration fixtures
├── docker/                    Self-hosting and recovery tooling
├── public/                    Public application assets
└── .smartsite/                 Ignored private local state (generated)
```

## Databases, media and integrations

### Database

The supported guided setup and transactional MCP workflow use **MongoDB with replica-set support**. Local bootstrap owns an isolated instance; hosted deployments use a separately configured database. PostgreSQL adapter packages exist in the source, but that does not certify equivalent bootstrap, transfer or MCP behavior. Use the documented MongoDB path unless you deliberately implement and verify another one.

### Media storage

Use local uploads during development. For a hosted site, choose durable storage appropriate to the host: Vercel Blob, S3, Cloudinary or UploadThing are configurable adapters. Supply credentials privately, allow the delivery hostname in Next.js image configuration, and verify actual uploaded images after deployment.

A database copy does not copy its media files. Moving a site requires an explicit asset transfer or deliberately retained access to the original assets.

### Forms and email

Forms and submissions are managed through Payload. Local email delivery is inert. Configure and verify production delivery before relying on a contact form for enquiries; do not assume a successful form render means an email reached its destination.

### Optional capabilities

Search, dark mode, localization, analytics and GSAP features are configurable. Enabling a switch may also require content, provider configuration or frontend design work. See [feature toggles](docs/workflows/feature-toggles.md).

## Deploy and maintain

SmartSite supports two documented hosting approaches:

| Approach | Typical arrangement |
| --- | --- |
| Managed hosting | A Node-compatible application host, managed MongoDB and durable media storage |
| Self-hosted | Dockerized app and authenticated MongoDB, with VPS deployment and recovery scripts |

Read [hosting modes](docs/product-specs/hosting-modes.md), [first launch](docs/workflows/first-launch.md) and [deployment](docs/workflows/deployment.md) before provisioning a destination. Hosting accounts, domains and third-party services are yours to choose and may have their own costs.

### First publication

Create the destination independently with its own identity, secrets, administrator and scoped MCP keys. Review which content should be transferred and published. The content-transfer helper provides a dry run, reference checks and a receipt; it is not an automatic background sync or a general overwrite command.

Do not copy local account credentials into production. Set the public URL, database, durable storage and email behavior for the destination. Verify the public site, admin, media, metadata and forms there.

### Ongoing releases

Deploy code without replacing the production database. When a schema change requires existing content to change, use a targeted migration with a tested backup. The self-hosted workflow includes off-server builds, promotion, status checks, backup, restore and rollback tools.

Keep code, database and uploaded media recoverable. A successful backup command alone does not prove recovery; test restoration into a separate environment.

## Verification and everyday commands

| Command | Purpose |
| --- | --- |
| `pnpm bootstrap` | Prepare a fresh local site or resume setup safely |
| `pnpm doctor` | Report actual local database, app and MCP readiness |
| `pnpm local:start` | Start this site's owned local processes |
| `pnpm local:stop` | Stop owned processes while preserving data |
| `pnpm generate:types` | Regenerate Payload TypeScript types |
| `pnpm generate:importmap` | Regenerate the admin component import map |
| `pnpm type-check` | Check TypeScript |
| `pnpm lint` | Check source conventions |
| `pnpm test:unit` | Run unit contracts |
| `pnpm build` | Build the configured application for production |

Integration, startup, transfer and deployment fixtures have stronger environment requirements. Run them only in clean disposable copies as described in [development](docs/workflows/development.md). Production builds may require reachable configured data and storage.

A passing compiler is only part of acceptance. Inspect the actual app in an external browser, exercise the changed interactions and confirm stored content and publication state.

## Frequently asked questions

### Is this a WordPress replacement?

It is an alternative for teams who want a familiar content-management experience with a Next.js/React/TypeScript codebase and AI-assisted development. It is not compatible with the WordPress plugin/theme ecosystem. Choose it for its source-level flexibility and integrated workflow, not for drop-in WordPress compatibility.

### How is this different from starting directly with Payload?

Payload supplies the CMS and plugin ecosystem. SmartSite packages additional site models, templates, routing, admin organization, frontend conventions, local operation, MCP workflows and portable agent guidance into one starter. You still use Payload's underlying APIs and extension model.

### Do I need an AI API key?

SmartSite itself does not require an LLM provider key for local setup or CMS editing. Your coding agent may require its own account or subscription. MCP uses a scoped SmartSite content key; it is not an LLM billing credential.

### Is there a SmartSite CLI or built-in AI chat?

No global SmartSite CLI is required. The former embedded AI chat and provider-key configuration have been retired. Use your preferred coding agent, the shipped skills and native MCP. Repository-local package scripts remain available for deterministic operations.

### Does the starter include Elvora?

No. Elvora is a separate showcase. Fresh sites receive a clean content database and the reusable SmartSite foundation.

### Is this a no-code product?

The everyday interaction can be conversational, but the output is a real application. An agent can handle much of the implementation; you still own the requirements, design choices, publication decisions and operational responsibilities. Developers can work directly in the source whenever needed.

### Can I use a different agent or host?

The shipped skill layouts target Codex and Claude Code. Other tools can read the same Markdown instructions and may connect through MCP if they support the transport and authentication. Hosting must satisfy the app's Node, database, storage and runtime requirements; verify your chosen environment rather than assuming universal compatibility.

### Does it include ecommerce, memberships or every marketing section?

Those are possible extensions, not a claim about the blank starter. The included CMS and source provide a foundation for building them. Review payment, account and integration requirements separately.

### Can I use it commercially?

The SmartSite code is provided under the [MIT license](LICENSE). Dependencies and bundled third-party material retain their own licenses. Demo branding, photographs and client content are not a general-purpose asset library supplied with the template.

## Documentation, contributions and credits

Start with the [documentation index](docs/index.md). It routes each task to a focused guide rather than requiring a complete repository read.

- [Getting started](docs/workflows/getting-started.md)
- [Component catalogue](docs/engineering/component-catalogue.md)
- [Design system](docs/engineering/design-system.md)
- [Content through MCP](docs/workflows/content-mcp.md)
- [Configuration and extensions](docs/engineering/configuration-system.md)
- [Troubleshooting](docs/workflows/troubleshooting.md)
- [First launch](docs/workflows/first-launch.md)
- [Deployment](docs/workflows/deployment.md)
- [Upgrading](docs/workflows/upgrading.md)

For a bug report, include the SmartSite version, operating system, relevant steps and a sanitized error. Never attach `.env`, private `.smartsite/` state, database dumps or API keys. For proposed changes, explain the problem, keep the scope focused and include the relevant code checks and real-app verification. Follow the repository's [development guide](docs/workflows/development.md).

SmartSite builds on Payload CMS, Next.js, React, Tailwind CSS, Radix UI, Lucide, GSAP and the wider open-source ecosystem. Bundled Payload skill attribution is retained alongside that material. See [releases](https://github.com/andy-dextrous/Smart-Site/releases) for changes to the starter.
