# SmartSite

**An open-source website builder powered by Next.js and Payload CMS, ready for development with Codex and Claude Code.**

[![Latest release](https://img.shields.io/github/v/release/andy-dextrous/Smart-Site)](https://github.com/andy-dextrous/Smart-Site/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](package.json)
[![Payload CMS](https://img.shields.io/badge/Payload_CMS-3-black)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue)](tsconfig.json)

[**Use this template**](https://github.com/new?template_name=Smart-Site&template_owner=andy-dextrous) · [**Explore the Elvora demo**](https://ai-smart-site.vercel.app) · [**Read the docs**](docs/index.md) · [**Release notes**](https://github.com/andy-dextrous/Smart-Site/releases)

SmartSite gives you a complete, working starting point for business websites, marketing sites, blogs and other content-rich projects. You get a Next.js frontend, a Payload CMS admin, reusable sections and templates, media management, forms, search, SEO and deployment tooling, all in one repository you own.

If you've used WordPress, the editing side will feel familiar: pages, posts, media, menus and an admin for day-to-day changes. Underneath, it is a modern TypeScript application. Sections are React components, content models are Payload schemas, and anything you want to change is ordinary source code. You extend the site by writing code, not by installing WordPress themes or plugins.

SmartSite is designed for conversational development. Open the repository in Codex or Claude Code, describe the site you want, and the agent finds what it needs inside the project: documentation, seven task-focused skills and a scoped connection to the CMS through Payload's official MCP plugin. Editors don't need any of that. The CMS works on its own, with no AI tool or model subscription required to keep the site current.

[Quick start](#quick-start) · [Features](#whats-included) · [Built on Payload](#routing-templates-and-caching) · [AI development](#building-with-an-ai-coding-agent) · [Deployment](#deploy-and-maintain) · [Documentation](#documentation)

## Why SmartSite?

- **The whole website in one repository.** Frontend, CMS, components, setup helpers, documentation and agent skills live together. A new agent session can learn how the site works from the project's own files.
- **A blank start.** Every new site begins empty. Setup creates an owner account, settings and a private local environment. It adds no sample businesses, placeholder testimonials or demo articles. The content and the design are yours.
- **Familiar for editors, flexible for developers.** Editors work in a structured admin with drafts, versions and preview. Developers work in Next.js, React, TypeScript and Tailwind CSS, with typed configuration and Payload's extension points.
- **Structured URLs and shared templates.** Pages can nest into a real site hierarchy, archives can live wherever you choose, and one template can control the layout of every article.
- **Published content stays current.** When content changes, shared caching and invalidation handle related listings, navigation and templates alongside the document you saved.
- **Releases leave content alone.** Code deployments, content transfer, backups and migrations are separate, documented workflows, so shipping a code update doesn't overwrite your production content.

## Quick start

### Prerequisites

| Requirement | Supported version |
| --- | --- |
| Node.js | 24.22.1 or a newer Node 24 patch (see `engines` in `package.json`) |
| pnpm | 10.34.8, pinned in `packageManager` |
| MongoDB | An installed MongoDB 8 `mongod` binary |
| Coding agent | Codex or Claude Code for the guided workflow (optional for manual development) |

Install Node and MongoDB from the official packages for your operating system and architecture. You don't need to start a database service or create a hosted database account: local setup launches its own authenticated, loopback-only MongoDB replica set for this site. The local process helpers rely on `ps`, and Windows lifecycle support is not yet certified. See [getting started](docs/workflows/getting-started.md) for platform notes and a pnpm fallback.

### 1. Create your repository

Choose [**Use this template**](https://github.com/new?template_name=Smart-Site&template_owner=andy-dextrous), create your repository and clone it. Your repository contains the complete application, documentation and development kit.

### 2. Set up the site

Open the folder in Codex or Claude Code and ask:

> Set up this SmartSite locally. Verify the app, admin and MCP connection, then help me plan a website for my business.

The agent follows the project's setup skill, which runs ordinary package scripts you can also run yourself:

```bash
pnpm install --frozen-lockfile
pnpm bootstrap
pnpm doctor
```

`bootstrap` generates private credentials and runtime state in the ignored `.smartsite/` directory. Each clone gets its own site identity, database, ports and keys, so keep that directory out of Git and don't copy it between clones. If bootstrap reports a problem, fix it and run bootstrap again. It reuses what already exists and keeps settings you've edited.

### 3. Connect your agent to the CMS

Reconnect the generated `smartsite` MCP server in your client and accept its project trust prompt if one appears. Then ask the agent to call `smartsiteRead` with `action: catalogue` and check that the identity it returns matches the output of `pnpm doctor`. A successful tool call confirms the connection.

Open the local site and `/admin` in your browser, and you're ready to build.

### Returning to the project

```bash
pnpm doctor        # report database, app and MCP readiness
pnpm local:start   # start this site's local processes
pnpm local:stop    # stop them; content is preserved
```

## Building your first site

1. **Write the brief.** Capture the audience, business facts, pages and goals in [the project brief](docs/project/brief.md).
2. **Set the visual direction.** Record typography, color, spacing and references in [the design notes](docs/project/design.md).
3. **Start with one useful page.** Reuse the included sections, or create a new local section when the design calls for one.
4. **Add real content.** Use the CMS or MCP for text, relationships, navigation and images, and check what is draft and what is public.
5. **Review the real site.** Look at desktop and mobile layouts, links, forms, imagery and the editing experience in the admin.
6. **Launch deliberately.** Choose hosting, configure durable media storage and email, transfer the approved content and check the public URL.

Your agent can do much of the implementation. Requirements, design choices and publishing decisions stay with you, and developers can work directly in the source whenever they like.

## What's included

| Area | What you get |
| --- | --- |
| Website application | Next.js App Router, React, TypeScript and Tailwind CSS |
| CMS | Payload admin with structured collections, rich-text editing and role-based access |
| Content models | Pages, posts, services, team, testimonials, categories and media |
| Layouts | A Templates collection for content-driven routes, plus configurable page sections |
| Site structure | Header and footer globals, nested pages and a central URI index |
| Editorial workflow | Drafts, publishing and versions on supported content types, with preview and admin links |
| Media | Local uploads, with Vercel Blob, S3, Cloudinary and UploadThing adapters |
| Forms | Payload form builder, submissions and configurable delivery |
| Search | Search indexing with results-page, command-palette and hybrid modes |
| SEO | SEO fields, metadata, redirects and sitemap generation |
| Motion | Configurable GSAP support and shared animation conventions |
| Optional features | Dark mode, localization and analytics |
| CMS access for agents | Payload's official MCP plugin with four scoped SmartSite tools |
| Agent guidance | Matching Codex and Claude skills, plus project brief and design files |
| Local operation | Bootstrap, readiness checks and isolated start/stop helpers |
| Deployment and maintenance | Managed-host guidance, Docker/VPS tooling, backups, rollback, content transfer and migrations |

Integrations such as cloud storage, email delivery and analytics need your own accounts and credentials before they do anything.

### Sections and building blocks

The starter ships with a compact set of editable sections:

- **Hero:** headline, supporting copy, media and calls to action
- **Content:** editorial content and rich-text layouts
- **Contact form:** a frontend for CMS-managed forms
- **Posts archive:** an article listing
- **Post hero, post content and related posts:** building blocks for article templates

Shared components handle layout, links, buttons, media, rich text and common UI, so new sections such as pricing tables, service cards or testimonial grids follow the same conventions. See the [component catalogue](docs/engineering/component-catalogue.md) and the [section development guide](docs/engineering/section-development.md).

### The Elvora showcase

[Elvora](https://ai-smart-site.vercel.app) shows what a customized SmartSite can become: a fully branded site with service pages, workshops, articles, team profiles and bespoke visual sections. It is a separate showcase. Its branding, content, workshop extension and custom designs are not part of the template, and none of it is seeded into a new site.

## The CMS

### Structured, reusable content

Pages are built from sections. Posts, services and team profiles have their own content models, and templates control how that content is presented. Testimonials and categories are reusable libraries, and media records hold your uploaded assets along with their descriptions.

Keeping copy separate from layout pays off as a site grows. Build a post template once from the post hero, content and related-posts sections, assign it to posts in the routing settings, and every article shares that presentation. Change the template and the articles follow.

### An admin for everyday work

The admin lives at `/admin` and brings content, site globals and settings together. Header and footer navigation are managed as globals. API keys sit under **Settings**, next to the other configuration entries.

CMS roles and collection/field permissions control who can do what. Visitors see published content, while signed-in editors can work on drafts wherever the content model supports them. Version history lets you restore earlier content when you need to.

<a id="how-smartsite-builds-on-payloads-website-starter"></a>

## Routing, templates and caching

Payload's official website template is a strong foundation. It already includes pages and posts, layout blocks, rich text, media, authentication, drafts and live preview, SEO, redirects, forms, search, cached data and on-demand revalidation.

SmartSite builds a fuller site architecture around those capabilities. Content types, public URLs, shared templates, cache refresh, site configuration and agent workflows are connected through common infrastructure, so you start with a working system instead of wiring those pieces together yourself.

| Area | Payload website template | SmartSite |
| --- | --- | --- |
| Public routes | Separate page and post routes using page slugs and `/posts/[slug]` | One catch-all renderer backed by a URI index across configured frontend collections |
| Site hierarchy | Single-slug page routes; nested docs configured for categories | Parent/child page paths and breadcrumbs, with dependent updates when the hierarchy changes |
| Homepage and archives | The page slug `home` maps to `/`; posts have their own route directory | CMS settings choose the homepage and each collection's archive page, which shapes the paths of its content |
| Reusable layouts | Page layout blocks and a dedicated post renderer | A Templates collection, per-collection template assignments and shared section rendering |
| Cache reads | Focused helpers, including cached globals and document lookups | One cache API for URIs, documents, collection queries and globals, with consistent keys and tags |
| Cache refresh | Page/post hooks revalidate routes and sitemap tags; globals and redirects have their own hooks | Shared document and global invalidation covering old and new paths, navigation references and template usage |
| Changed URLs | Redirects plugin and redirect management | Automatic redirects for supported published URL changes |
| Content models | Pages, posts, media, categories and users, plus plugin collections | Adds services, team, testimonials, templates and the URI index |
| Configuration | Application-specific Payload config, plugins and frontend source | Typed `smartsite.config.ts`, a local extension registry and a clear boundary between site code and shared core |
| Search | Search plugin for posts with a results page | Results-page, command-palette and hybrid modes |
| Storage | Media uploads, with extension points for other services | Ready-to-configure local, Vercel Blob, S3, Cloudinary and UploadThing storage |
| Agent content editing | No MCP plugin configured | Payload's official MCP plugin with four scoped tools, revision checks and operation receipts |
| Development and launch | Setup instructions, environment configuration, seed and deployment guidance | Portable Codex/Claude skills, blank-site bootstrap, isolated local lifecycle, environment identity, and content transfer, backup and recovery workflows |

<sub>Compared with the [Payload website template at revision `aebbf75`](https://github.com/payloadcms/payload/tree/aebbf75b93e218be4b53a3c7922e0bc82924830b/templates/website) (October 2026) and SmartSite 3.0.1. The comparison covers what each starter ships, not everything Payload can be extended to do. Upstream reference points: [page route](https://github.com/payloadcms/payload/blob/aebbf75b93e218be4b53a3c7922e0bc82924830b/templates/website/src/app/%28frontend%29/%5Bslug%5D/page.tsx), [page revalidation hook](https://github.com/payloadcms/payload/blob/aebbf75b93e218be4b53a3c7922e0bc82924830b/templates/website/src/collections/Pages/hooks/revalidatePage.ts), [cached globals](https://github.com/payloadcms/payload/blob/aebbf75b93e218be4b53a3c7922e0bc82924830b/templates/website/src/utilities/getGlobals.ts), [plugins](https://github.com/payloadcms/payload/blob/aebbf75b93e218be4b53a3c7922e0bc82924830b/templates/website/src/plugins/index.ts).</sub>

### URIs: the site's address book

A **slug** is one segment of a URL, such as `our-story`. A **URI** is the complete path inside your site, such as `/about/our-story`. SmartSite gives every public path its own indexed record instead of making each content type responsible for its own frontend route.

Each URI record links a path to its source collection, document, publication status, template and breadcrumbs. When a request arrives, the renderer looks up the path, loads the content, applies the assigned template if the document has no sections of its own, and renders the result. Static route generation reads the same index.

In practice:

- A page called **Our story** beneath **About** resolves to `/about/our-story`.
- Assign an **Insights** page as the posts archive, and articles resolve to `/insights/article-title` instead of a hard-coded `/posts/article-title`.
- Choose a different homepage in settings, and that page resolves to `/`.
- A new frontend collection can use the same routing and rendering once you've given it a schema, configuration and a suitable presentation.

Your site's structure can follow how the business thinks about its information, not how the database names its collections, and routing, breadcrumbs, templates and redirects all work from the same record. See the [routing engine](src/admin/routing/uri-engine.ts), [URI index manager](src/admin/routing/index-manager.ts) and [published URI renderer](src/admin/components/published-uri-renderer.tsx).

### Caching and invalidation

**Caching** lets the site reuse earlier results instead of querying the database on every request. **Invalidation** tells the site which of those saved results are out of date after a change. Payload's template already uses Next.js caching and revalidation. SmartSite extends it into shared infrastructure for its broader content and routing model:

- **Consistent reads.** Helpers fetch content by URI, ID or slug, query collections and load globals, with cache keys that separate query parameters and draft/published modes.
- **Named groups.** Tags identify individual items, collections, URI lookups and globals, so change handlers can refresh the relevant groups.
- **Publication awareness.** Draft-only saves are handled differently from publishing, unpublishing or editing live content.
- **Old and new addresses.** When a path or slug changes, both the previous and the current address are refreshed.
- **Related elements.** Built-in handlers check navigation references, archive assignments and parent changes. Editing a template finds the published content that uses it and refreshes those routes.
- **Recovery.** Site-wide refresh and URI regeneration are available for repairs and changes that touch everything.

Publishing an article triggers refreshes for its page and cached collection queries. A template change uses the URI index to find published content to refresh. Developers use the same mechanisms across supported content types.

This dependency handling is explicit: it covers the relationships SmartSite knows about. When you add custom queries, external caches or new extensions, give them the appropriate tags and hooks. Bulk operations should be checked for completion and handler limits. See the [cache API](src/admin/cache/cache.ts), [revalidation handlers](src/admin/cache/revalidation.ts) and the [routing and caching guide](docs/engineering/routing-and-caching.md).

### Changes that ripple across the site

Renaming a parent page, moving a collection's archive or editing a shared template can change many public routes at once. SmartSite detects the dependent content and hands the follow-up work to a Payload task, which the hook queues and runs straight away. That work updates the affected URIs, breadcrumbs and cached output together.

When a supported published URL changes, SmartSite can create a redirect from the old address automatically. Redirects for pages and posts point at the content record itself, so they keep following that content to its current address. Redirects for other collections store a destination URL. Redirects you've created by hand are left as they are. After a significant restructure, spot-check a few old and new URLs. See the [dependency task](src/admin/payload/jobs/dependency-updates/handler.ts), [job invocation](src/admin/payload/hooks/utilities/context-management.ts) and [automatic redirects](src/admin/redirects/auto-redirects.ts).

## Building with an AI coding agent

Your agent edits layouts, components and configuration in the source files. It uses MCP to read and update the content stored in Payload.

SmartSite uses **Payload's official [`@payloadcms/plugin-mcp`](https://payloadcms.com/docs/plugins/mcp)** for the MCP endpoint and API-key authentication, and registers four focused content tools on it. There's no separate MCP server to run, and SmartSite doesn't need an AI provider key. Your coding agent uses its own account.

### Four content tools

| Tool | What it does |
| --- | --- |
| `smartsiteRead` | Discover the site's identity, content catalogue and schemas; find, read and inspect the history of content |
| `smartsiteSave` | Create or update one item, with an explicit publishing mode and revision check |
| `smartsiteUploadMedia` | Upload a PNG, JPEG or WebP image with alt text |
| `smartsiteOperationStatus` | Look up the outcome of an earlier operation |

These tools are built so that an agent works with your content safely:

- **Keys are tied to people.** Each MCP key belongs to a CMS user and is granted specific tools. That user's roles and field permissions still apply, and accounts, keys, form submissions and internal records stay out of reach. The endpoint offers no shell or raw database access.
- **Edits don't overwrite each other.** Every save is checked against the version the agent last read. If an editor has changed the item since then, the agent has to re-read it and reconcile the two versions before it can save.
- **Every write leaves a receipt.** If a connection drops mid-save, the agent can check the receipt to see whether the change landed instead of guessing and writing twice.
- **Publishing is a deliberate choice.** Draft-capable content is saved as a draft, published or unpublished explicitly. Globals without drafts change immediately.

Image uploads through MCP accept PNG, JPEG and WebP files up to 2 MiB and 40 million pixels. Use the CMS for larger files or other formats. Custom collections can be opted in to MCP in site configuration. See the [content workflow](docs/workflows/content-mcp.md) and the [MCP contract](docs/engineering/mcp.md).

### Seven skills that travel with your site

| Skill | Purpose |
| --- | --- |
| `smartsite-start` | Set up or resume the site and verify the connection |
| `smartsite-build` | Turn a brief into a coherent website |
| `smartsite-sections` | Add or change section schemas and renderers |
| `smartsite-content` | Read and edit stored content through MCP |
| `smartsite-data` | Extend collections and handle data changes |
| `smartsite-repair` | Diagnose problems in the actual environment |
| `smartsite-launch` | Prepare hosting, content transfer and launch checks |

Codex skills live in `.agents/skills/` and Claude skills in `.claude/skills/`. Each has a root entry point, [AGENTS.md](AGENTS.md) or [CLAUDE.md](CLAUDE.md), and both share the same project documentation. A bundled Payload reference skill supports deeper CMS work. Skills are guidance, not permissions: your client's trust, approval and credential settings still decide what an agent can do. Other coding agents can follow the same Markdown workflows.

## Customize and extend

[`src/smartsite.config.ts`](src/smartsite.config.ts) is the main place to shape your site: identity, collection options, feature switches, storage, animation and extensions.

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

Anything you leave out inherits the core defaults, and the configuration types are the definitive reference for available options.

- **A new visual section:** add a schema and renderer following the section guide, reusing shared fields and layout conventions.
- **A new content type:** create a Payload config in `src/extensions/`, register it, then enable its slug in configuration.
- **A built-in collection:** configure the existing collection (or disable it) rather than registering a duplicate.
- **A new MCP target:** opt it in explicitly and review its access rules and exposed fields.
- **Styling:** change your frontend components and design system.

`src/admin/` is the shared SmartSite core. Keeping site-specific work in the frontend, configuration and extensions makes future core upgrades much easier to review. See [configuration and extensions](docs/engineering/configuration-system.md), the [admin layer](docs/engineering/admin-layer.md) and [upgrading](docs/workflows/upgrading.md).

## Project structure

```text
.
├── AGENTS.md / CLAUDE.md       Agent entry points
├── .agents/skills/             Codex skills and Payload reference
├── .claude/skills/             Claude skills and Payload reference
├── src/
│   ├── app/                    Next.js routes and application entry points
│   ├── admin/                  Shared SmartSite CMS core
│   ├── components/             Site sections, shared fields and UI
│   ├── extensions/             Site-specific Payload extensions
│   └── smartsite.config.ts     Site configuration
├── docs/                       Project brief, design notes and workflows
├── scripts/                    Local lifecycle and operational helpers
├── tests/                      Unit tests and disposable integration fixtures
├── docker/                     Self-hosting and recovery tooling
├── public/                     Public assets
└── .smartsite/                 Private local state (generated, ignored)
```

## Databases, media and integrations

**Database.** Guided setup and the MCP content tools use MongoDB with replica-set support, which provides the transactions that checked content writes rely on. Locally, bootstrap runs an isolated instance for you; hosted sites use a separately configured MongoDB. PostgreSQL adapter packages are present in the dependencies, but bootstrap, content transfer and MCP are built around MongoDB.

**Media storage.** Local uploads work out of the box for development. For a hosted site, choose durable storage such as Vercel Blob, S3, Cloudinary or UploadThing, supply its credentials privately and allow its hostname in the Next.js image configuration. Media files live outside the database, so moving a site means moving its assets too.

**Forms and email.** Forms and submissions are managed in Payload. Email delivery is inactive locally, so configure and test production delivery before relying on a contact form.

**Optional features.** Search, dark mode, localization, analytics and GSAP animation are switched in configuration. Some also need content, a provider account or design work. See [feature toggles](docs/workflows/feature-toggles.md).

## Deploy and maintain

| Approach | Typical arrangement |
| --- | --- |
| Managed hosting | A Node-compatible application host, managed MongoDB and durable media storage |
| Self-hosted | A Dockerized app and authenticated MongoDB on a VPS, with deployment, backup and recovery scripts |

Read [hosting modes](docs/product-specs/hosting-modes.md), [first launch](docs/workflows/first-launch.md) and [deployment](docs/workflows/deployment.md) before provisioning. Hosting, domains and third-party services are your choice and may carry their own costs.

**First launch.** Set up the destination as its own environment, with its own identity, secrets, administrator and scoped MCP keys. Local credentials never move to production. Choose which content to transfer: the transfer helper offers a dry run, checks references and records a receipt. Then set the public URL, database, storage and email for the destination and check the live site, admin, media, metadata and forms.

**Ongoing releases.** Deploy code without replacing the production database. When a schema change needs existing content to change, run a targeted migration after taking a tested backup. The self-hosted workflow includes off-server builds, promotion, status checks, backup, restore and rollback. Test a restore into a separate environment so you know your backups actually work.

## Everyday commands

| Command | Purpose |
| --- | --- |
| `pnpm bootstrap` | Prepare a fresh local site, or resume setup |
| `pnpm doctor` | Report local database, app and MCP readiness |
| `pnpm local:start` | Start this site's local processes |
| `pnpm local:stop` | Stop them while keeping your data |
| `pnpm generate:types` | Regenerate Payload TypeScript types |
| `pnpm generate:importmap` | Regenerate the admin component import map |
| `pnpm type-check` | Check TypeScript |
| `pnpm lint` | Check source conventions |
| `pnpm test:unit` | Run unit tests |
| `pnpm build` | Build the application for production |

Integration, startup, transfer and deployment tests need clean, disposable copies of the project; the [development guide](docs/workflows/development.md) explains how to run them. Alongside the checks, open the app in a browser and try the things you changed.

## Documentation

The [documentation index](docs/index.md) points each task to a focused guide:

- [Getting started](docs/workflows/getting-started.md)
- [Component catalogue](docs/engineering/component-catalogue.md)
- [Design system](docs/engineering/design-system.md)
- [Content through MCP](docs/workflows/content-mcp.md)
- [Configuration and extensions](docs/engineering/configuration-system.md)
- [Routing and caching](docs/engineering/routing-and-caching.md)
- [Troubleshooting](docs/workflows/troubleshooting.md)
- [First launch](docs/workflows/first-launch.md)
- [Deployment](docs/workflows/deployment.md)
- [Upgrading](docs/workflows/upgrading.md)

## Contributing

Bug reports and focused improvements are welcome. When reporting a bug, include the SmartSite version, your operating system, the steps to reproduce it and a sanitized error message. Never attach `.env` files, `.smartsite/` state, database dumps or API keys.

For a pull request, explain the problem it solves, keep the scope focused, and include the relevant code checks along with what you verified in the running app. The [development guide](docs/workflows/development.md) covers the workflow.

## License and credits

SmartSite is released under the [MIT license](LICENSE). Dependencies and bundled third-party material keep their own licenses. Elvora's branding, photography and content belong to the showcase and are not included for reuse.

SmartSite is built on [Payload CMS](https://payloadcms.com), Next.js, React, Tailwind CSS, Radix UI, Lucide, GSAP and the wider open-source ecosystem. Attribution for the bundled Payload skill is kept alongside that material. See the [releases](https://github.com/andy-dextrous/Smart-Site/releases) for changes to the starter.
