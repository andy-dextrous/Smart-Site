# Development

## Environment model

- Local: fastest development loop, normal `pnpm dev`, local MongoDB Community, safe for schema and section work
- Production: live client site, separate Mongo data, indexing enabled, backups and restore path mandatory
- Preview: optional production-like verification environment, separate public URL, separate Mongo data, indexing disabled

For self-hosted sites, `smartsite-deployment.json` is the source of truth and generated env files live under `.smartsite-self-hosted/`.

## Recommended development process

1. develop locally first
2. seed or refresh local data intentionally and only with explicit approval for database-writing actions
3. deploy preview only when needed
4. promote to production
5. back up before risky changes

## Common commands

```bash
pnpm bootstrap
pnpm doctor
pnpm dev
pnpm seed
pnpm generate:types
pnpm lint
pnpm type-check
pnpm ai:enable
pnpm self-hosted:init
pnpm self-hosted:prepare
pnpm self-hosted:run -- guard
pnpm self-hosted:run -- status
```

## Rebuild rules

Rebuild when:

- frontend code or section code changes
- Payload schemas change
- any `NEXT_PUBLIC_*` value changes
- `NEXT_DEPLOYMENT_ID` changes
- the public hostname or preview hostname changes

You do not need a rebuild for every content edit.

Source: [source-manuscript-readme.md](../references/source-manuscript-readme.md)

## 🛠 Development Workflow

### Environment Model

Smart Site supports both hosted and self-hosted delivery, but the developer-facing workflow should stay small:

- **Local**: fastest development loop, normal `pnpm dev`, local MongoDB Community, safe for schema and section work
- **Production**: live client site, separate Mongo data, indexing enabled, backups and restore path mandatory
- **Preview**: optional production-like verification environment, separate public URL, separate Mongo data, indexing disabled, only created when the site or change risk justifies it

For self-hosted sites, the source of truth is `smartsite-deployment.json`. Scripts generate the per-environment env files under `.smartsite-self-hosted/generated/` so developers and agents do not have to hand-maintain them.

SmartSite should only need one checked-in env template: `.env.example`. Self-hosted runtime env files are generated artifacts and should stay hidden under `.smartsite-self-hosted/`, not live as first-class files in the app root.

### Recommended Development Process

1. **Develop locally first** - Build sections, fields, and content model changes against local MongoDB with `pnpm dev`
2. **Seed or refresh local data intentionally** - Use local Mongo dumps or seed flows only when the user explicitly wants a database-writing action. Treat seed flows as destructive bootstrap tools for local development, not routine maintenance.
3. **Deploy preview only when needed** - Use it for sensitive live work, stakeholder review, or changes that need production-like verification
4. **Promote to production** - Rebuild against the production URL and production Mongo data
5. **Back up before risky changes** - Always take a fresh Mongo backup before destructive restores or content promotions

### Common Tasks

| Task | Command/Location | Notes |
| --- | --- | --- |
| **Create section** | `src/components/sections/` | `config.ts` + `Component.tsx` |
| **Add field pattern** | `src/components/fields/` | Reusable field groups |
| **Bootstrap local install** | `pnpm bootstrap` | Interactive local-first setup helper for local Mongo or Atlas; can offer one-time local seed with explicit approval |
| **Inspect site health** | `pnpm doctor` | Detects hosted vs self-hosted and prints next safe step |
| **Customize admin** | `src/smartsite.config.ts` | Keep shared changes here when possible |
| **Add collection** | `extensions.collections` | Register in config file |
| **Style frontend** | `app/(frontend)/css/` | Tailwind v4 styles |
| **Add API route** | `app/(frontend)/api/` | Frontend endpoints |
| **Quick animations** | Data attributes (`data-animate`, etc.) | Enable `gsap.globalAnimations` in config |
| **Initialize self-hosted config** | `pnpm self-hosted:init` | Copies the deployment manifest template |
| **Prepare self-hosted artifacts** | `pnpm self-hosted:prepare` | Generates hidden env files from the manifest |
| **Enable AI** | `pnpm ai:enable` | Turns AI on in config; provisioning remains explicit |
| **Deploy production** | `pnpm self-hosted:run -- promote` | Rotates `NEXT_DEPLOYMENT_ID`, rebuilds, and restarts production |
| **Deploy preview** | `pnpm self-hosted:run -- preview` | Builds and starts the optional preview environment |
| **Backup self-hosted Mongo** | `pnpm self-hosted:run -- backup` | Writes compressed Mongo archive |
| **Run safety guard** | `pnpm self-hosted:run -- guard` | Shows git-state warnings before a risky action |
| **Probe runtime health** | `pnpm self-hosted:run -- probe` | Verifies compose health plus public site and admin responses |
| **Inspect release history** | `pnpm self-hosted:run -- history` | Shows the current release and recent release log |
| **Rollback deploy** | `pnpm self-hosted:run -- rollback` | Rebuilds and restarts using the previous recorded release |
| **Inspect self-hosted stack** | `pnpm self-hosted:run -- status` | Shows compose status and backup state |

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
# Local development
pnpm bootstrap
pnpm doctor
pnpm dev

# Local database and content bootstrap
pnpm seed
pnpm self-hosted:dump -- .env .smartsite-self-hosted/backups/manual/local.archive.gz

# Self-hosted deployment lifecycle
pnpm self-hosted:init
pnpm self-hosted:prepare
pnpm self-hosted:run -- promote
pnpm self-hosted:run -- preview
pnpm self-hosted:run -- backup
pnpm self-hosted:run -- guard
pnpm self-hosted:run -- history
pnpm self-hosted:run -- probe
pnpm self-hosted:run -- rollback
pnpm self-hosted:run -- status
pnpm self-hosted:run -- install-backup-cron

# Quality checks
pnpm generate:types
pnpm lint
pnpm type-check
```

### Rebuild Rules

Rebuild the site when any of the following changes:

- frontend code or section code
- Payload collections, blocks, globals, or field schemas
- any `NEXT_PUBLIC_*` value
- `NEXT_DEPLOYMENT_ID`
- public hostname, preview hostname, or `CADDY_SITE_ADDRESS`

You do **not** need a rebuild for every content edit. Payload admin writes straight to MongoDB. Rebuilds are required when code or build-time public configuration changes.

### Safety Guards

The self-hosted flow now adds guardrails around destructive or risky operations:

- `promote`, `preview`, `rollback`, and `restore` warn on git-state problems
- dirty worktrees block risky actions unless you pass `--force`
- production deploy and rollback block when the current branch is behind upstream unless you pass `--force`
- production restore takes a fresh production backup before overwrite
- production restore refuses to apply an older archive over a newer production snapshot unless you pass `--force`
- seed flows are local-only bootstrap actions and should never be run casually or against non-local databases
- local seed flows verify the running site against the current project before writing data; wiping existing data is a separate explicit choice and requires an extra destructive confirmation
- rerunning bootstrap on an already configured project requires explicit approval

Agent rule:

- never run `pnpm seed`, `npx smartsite seed starter --project .`, `/api/seed`, `mongorestore`, or any other database-writing command without explicit user approval for that specific action
- always warn that the action can overwrite or replace existing data before proposing or running it
- never rerun `smartsite init` or another bootstrap flow on an already configured project unless the user explicitly asks for it

Use this to inspect the current guard state explicitly:

```bash
pnpm self-hosted:run -- guard
```

### Data Movement Rules

- **Local → preview**: create or reuse a Mongo archive, restore it into the preview stack, then redeploy preview
- **Production → preview**: back up production first, restore that archive into preview, then redeploy preview
- **Preview → production**: only restore intentionally versioned or approved data; always take a fresh production backup first
- **Preview**: always use HTTPS for self-hosted preview routes

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
