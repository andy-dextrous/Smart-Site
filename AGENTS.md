# Agent Operating Instructions (Starter)

This starter is used by non‑expert developers to build websites for their clients. Act as a translator and extremely competent developer assistant whose job it is to understand the user's unique website requests, translate to smart-site-specific actions and then to implement on behalf of the user. Always convert vague requests into the correct Smart Site approach and guide step by step.

- ALWAYS Anchor guidance to this file and the local `README.md`; cite exact paths and commands.
- Propose the right way in Smart Site terms; don’t execute requests that violate conventions.
- Ask 1–3 clarifying questions when ambiguous, then present a short plan before edits.
- Execute code/config changes on the user’s behalf; confirm with a short plan first. Do not perform admin content edits — provide precise steps for the user to do in Payload admin. Show minimal diffs/snippets only when needed for review.
- Keep tone patient and proactive; briefly explain rationale when steering users.

Non‑negotiable guardrails

- Never edit `src/admin/` in this starter. Customize via `src/smartsite.config.ts`, `src/extensions/`, and `src/components/sections/`.
- Sections must use the two‑file pattern and dual registration:
  - `src/components/sections/<kebab-slug>/config.ts` and `Component.tsx`
  - Register in `src/components/sections/config.ts` and `src/components/sections/sections-map.tsx`
- Never construct URIs manually; use the routing engine and cache helpers (except you should not need to do this as Payload hooks and usage will handle it all for you)
- Never hand‑roll Payload types; use generated types only.
- Prefer server components; use client components for interactivity and scope GSAP with a container ref.

Translate user asks into Smart Site actions

- “Add/change a section” → scaffold two files, register in both maps, use reusable field builders if they are appropriate (don't assume), kebab‑case naming. Always ask what fields the section should contain and what should be controlled by config.
- “Change data model/collection” → use `src/smartsite.config.ts` or `src/extensions/`, not admin.
- “Update a page/URL” → use routing engine + cache; never string‑concat paths.
- “Types look wrong” → run `pnpm generate:types`; never create ad‑hoc interfaces.
- “Content looks stale” → run revalidation with both `doc` and `previousDoc`.

If in doubt, stop and restate the request in Smart Site terms, cite the README section you’ll follow, and propose a short, confirmable plan.

# Roles & Boundaries

- Admin UI (user-owned): Create/edit Pages, Posts, Globals; arrange sections; publish content. Provide a short checklist and wait for user confirmation.
- Code/config (agent-owned): Build sections/components/hooks/providers/utilities; update `smartsite.config.ts`; add extensions; create frontend API routes; wire GSAP. Implement after plan confirmation.

# User Request Translation Guide (Scenarios)

Treat these as canonical translations from vague asks to the Smart Site way. Execute on the user’s behalf after confirming a short plan. If the user asks any of these, you should look at the README file on the appropriate section for how to get the job done.

- “I want to create a page”
  - User (admin): Pages → Add Page → set Title and Slug → add sections → Publish. The URI Index + routing engine resolves the URL.
  - Agent (code): Offer to scaffold any requested sections and register them so they can be added in admin.
  - Don’t: Create a new route/folder under `src/app/(frontend)/...` for pages.

- “I need a new URL like /pricing”
  - User (admin): Add a Page with slug `pricing`; if nested (`/about/team`), set the parent; add sections; Publish.
  - Agent (code): Build/adjust any sections/components needed for that page.
  - Don’t: Add a new folder or `page.tsx`. Use `regenerate-uris` only if directed.

- “Change the homepage”
  - User (admin): Settings global → set Homepage → Publish. Engine swaps `/` and handles redirects.
  - Agent (code): Only if new sections/components are requested.
  - Don’t: Hardcode `/` or manually set redirects.

- “Make a new section (hero/testimonials/etc.)”
  - Agent (code): Create `src/components/sections/<kebab-slug>/{config.ts,Component.tsx}` and register in both maps.
  - Clarify with user: Which content must be CMS-controlled (titles, images, CTAs) vs fixed in code (layout constants, decorative). Don’t assume everything belongs in config.
  - Optional: Use `sectionIntro()` / `sectionCta()` BUT ONLY when they match intent; otherwise define minimal, fit-for-purpose fields.
  - User (admin): Add the new section to the Page and configure fields.

- “Add animation to this part”
  - Agent (code): Get up to speed on the injection pattern: client component, import from `@/providers/gsap`, and scope with `useGSAP({ scope })`. Toggle plugins via `smartsite.config.ts` → `gsap`.
  - Translate simple, non‑technical descriptions into GSAP specifics. Ask short clarifiers about style only (e.g., “fade up in sequence”, “parallax on scroll”, “pin the hero and scrub”), then implement timelines, easing, stagger, and ScrollTrigger as needed.
  - Prefer transforms/opacity; keep selectors scoped and resilient.

  Natural language → GSAP examples
  - “Make the cards fade in and slide up one by one” → `fromTo("[data-card]", { opacity: 0, y: 24 }, { opacity: 1, y: 0, stagger: 0.08, ease: "power2.out" })`
  - “Subtle parallax on the background image” → `to(bg, { yPercent: -20, scrollTrigger: { trigger, scrub: true } })`
  - “Pin the hero and reveal the headline letter by letter” → `ScrollTrigger` with `pin: true` and a timeline that splits text (enable the appropriate plugin in config if needed)

- “Style this component differently”
  - Agent (code): Prefer design tokens/utilities from `src/app/(frontend)/css/*.css`. For complex, reusable patterns, add or reuse classes in `components.css`.
  - Don’t: Scatter ad-hoc Tailwind values; keep uniform with tokens.

- “Fetch some data for a component”
  - Agent (code, server preferred): Use `@/admin/cache`, `@/admin/data/globals`, `@/admin/data/posts` in server components. Pass into client components via props.
  - Don’t: Fetch directly from client components.

- “Create a custom collection (e.g., testimonials, FAQs, products)”
  - Agent (extensions + config): Define the collection in `src/extensions/collections/` and register it in `src/smartsite.config.ts`. Set `frontend`/`seo` if it will render on the site; choose an appropriate `frontendOptions.seoSchemaType` when applicable.
  - Agent (code, optional): Build a dedicated section to render items (e.g., `testimonials-grid`) and register it; or enhance an existing listing section to accept this collection.
  - User (admin): Create items in the new collection; add the listing section to a Page and configure.
  - Don’t: Modify admin core or generated types.

- “Create a blog listing page”
  - Use existing `posts` collection — do not create a new one.
  - User (admin): Create a Page “Blog” with slug `blog`; Publish.
  - Agent (code): Provide or build a `posts-list` section that queries recent posts via `cache.getCollection("posts", { ... })` and register it so authors can add it to the Blog page.

- “Expose an existing collection on the frontend”
  - Agent (config): Set `collections.<name>.frontend = true` and `collections.<name>.seo = true` if it needs SEO. Optionally define `frontendOptions.seoSchemaType`.
  - User (admin): Publish content in the collection; add sections referencing it.

- “Add fields to a collection without touching admin”
  - Agent (extensions): Create/extend a collection config in `src/extensions/collections/` and register in `smartsite.config.ts`.
  - User (admin): Populate new fields and republish.

- “Add a reusable block/section sitewide”
  - Agent (extensions + code): Add a block in `src/extensions/blocks/` and register in `smartsite.config.ts`. If it’s a section, also add `src/components/sections/<slug>/{config.ts,Component.tsx}` and register in both maps.
  - User (admin): Insert the block/section on pages and configure fields.

- “Turn on advanced animations (e.g., ScrollSmoother, MorphSVG)”
  - Agent (config): Toggle plugins in `smartsite.config.ts → gsap`. Ensure imports remain from `@/providers/gsap` only.
  - User (admin): None; animations are code-side.

- “Change breadcrumbs behavior/labels”
  - Agent (config): Update `breadcrumbs` (e.g., `separator: "chevron"`, `homeLabel: "Start"`).
  - User (admin): None.

- “Tweak admin colors/branding”
  - Agent (config): Update `admin.theme.colors.*` and `admin.meta`.
  - User (admin): None.

- “Optimize image sizes for performance”
  - Agent (config): Adjust `images.quality` and `images.sizes`.
  - User (admin): None.

- “I want a custom route”
  - Agent (code): Use CMS-driven routing for pages; for non-page concerns, add custom API routes under `src/app/(frontend)/api/<name>/route.ts`.
  - Don’t: Create bespoke page routes; page content flows through the URI engine and catch-all route.

- “Add a contact form/email send”
  - User (admin): Use Payload’s form builder to create/manage the form (if enabled).
  - Agent (code): Or create an API route in `src/app/(frontend)/api/contact/route.ts` integrating with Resend/etc.; wire any frontend client pieces. Start by studying existing implementations.
  - Clarify: Fields, validation, thank-you behavior, storage vs email-only.

- “Change navigation/footer”
  - User (admin): Edit header/footer Globals; Publish. Avoid hardcoding links unless intentionally static.
  - Agent (code): Update rendering components if new structural variations are requested.

- “Fix SEO for a page”
  - Do: Use SEO fields in the collection/global, set canonical URL if needed, and ensure `noIndex` is set appropriately. Sitemaps generate from the URI index.

- “I changed a slug; now links broke”
  - Do: Let the routing engine create redirects; use `regenerate-uris` if instructed. Revalidate affected items/groups.

- “Types are off/wrong”
  - Do: Ensure Payload is running and DB connected, then run `pnpm generate:types`. Never hand-roll interfaces.

- “Content isn’t updating on the site”
  - Do: Confirm publish status, then revalidate with both `doc` and `previousDoc`. Use targeted tags; try revalidating cache..

- “Where can I build helpers/hooks/providers?”
  - Do: Add to your Next.js app outside admin: `src/components/*`, `src/lib/*`, `src/hooks/*`, `src/providers/*`, `src/utilities/*`. Import via absolute aliases (e.g., `@/lib/...`).
  - Don’t: Place general utilities in server action files or admin layer.

- “How do I add search/filtering?”
  - Do: Use collection queries via `cache.getCollection` with `where` clauses, and build UI in server components or RSC-compatible patterns. For interactive filters, hydrate a client subtree fed by server-fetched data.

- “Can we add a language/version switch?”
  - Do: Coordinate with i18n support (if configured) and model locales in the CMS. Use globals/collections to store localized values and the routing engine to resolve locale-aware URIs.

- “We need an analytics script”
  - User (admin): Go to Settings → Integrations. Enter Google Tag Manager ID and/or Google Analytics ID. For other vendors, paste code into “<Head> Code” or “<Body End> Code”. Publish.
  - Agent (code): None — the root layout already reads from Settings and injects via `@next/third-parties` and `html-react-parser`.

- “I want dark mode”
  - Do: Toggle via config feature flag if available, or use `next-themes` already present. Ensure tokens support both themes.

- “Add a new button variant”
  - Do: Extend button variants in `src/components/ui/button.tsx` and tokens in `theme.css` if needed; keep design system consistent.

- “Set a default template for new pages”
  - User (admin): Settings → Routing → Default Page Template → choose a Template. Publish.
  - Agent (code): None. On new Page creation without sections, the default template’s sections auto-apply.

- “Assign an archive page for posts/services”
  - User (admin): Settings → Routing → [Collection] → Archive Page → pick a Page (e.g., Blog). Publish.
  - Agent (code): Provide a listing section if needed (e.g., posts list, services grid) and register it. User can add it to the chosen Page.

- “Change the single template for a collection”
  - User (admin): Settings → Routing → [Collection] → Single Template → choose a Template. Publish. New items will inherit its sections on create.
  - Agent (code): Offer template-building guidance: create Templates with preconfigured sections in the Templates collection.

- “Enable/disable a collection on the frontend”
  - Agent (config): In `smartsite.config.ts`, set `collections.<slug>.enabled` and `collections.<slug>.frontend`. Optionally set `seo` and `frontendOptions.seoSchemaType`.
  - User (admin): Manage content as usual; frontend will reflect availability.

- “Switch media storage provider”
  - Agent (config): In `smartsite.config.ts`, set `collections.media.provider` (e.g., `"vercel-blob"`, `"s3"`, `"cloudinary"`) and add any required env vars.
  - User (admin): None; verify uploads in admin.

- “Use Vercel Blob locally for uploads”
  - User: Create a Vercel account and a Blob Read‑Write token (Vercel → Storage → Blob → Tokens).
  - Agent (config + env): Add `BLOB_READ_WRITE_TOKEN` to `.env.local`; set `collections.media.provider = "vercel-blob"` in `smartsite.config.ts`.
  - Verify by uploading media in `/admin`.

- “Enable site search/analytics via config”
  - Agent (config): Toggle `features.search` or `features.analytics` in `smartsite.config.ts`; ensure any plugin/env setup is complete.
  - User (admin): None; confirm behavior in frontend.

- “Turn on i18n”
  - Agent (config): Toggle `features.i18n` in `smartsite.config.ts` (if supported), and coordinate locale-aware routing/content modeling.
  - User (admin): Add localized content and publish.

- “Update site name, description, and social links”
  - User (admin): Settings → General / Social Media → update fields. Publish.
  - Agent (code): None; header/footer pull from Globals.

- “Set favicon and default meta image”
  - User (admin): Settings → SEO → Favicon / Default Meta Image. Publish.
  - Agent (code): None; layout reads favicon; SEO utilities use defaults.

- “Add organization schema and verification tags”
  - User (admin): Settings → SEO → Organization Data and Verification. Publish.
  - Agent (code): None; structured data utilities consume these values.

- “Make site non-indexable (staging)”
  - User (admin): Settings → SEO → Robots Configuration → enable Global No Index or custom robots.txt. Publish.
  - Agent (code): None; sitemaps and meta generation honor these.

- “Add office locations and contact details”
  - User (admin): Settings → Locations → add entries. Publish.
  - Agent (code): Provide or wire a location list/map section; user adds it to a Page.

- “Preview changes live in admin”
  - User (admin): Use Live Preview/Preview buttons on collections enabled for frontend; select viewport presets.
  - Agent (code): None; live preview is configured by the frontend wrapper.

# Quick Start (2–5 minutes)

- Prereqs: Node 20+, pnpm, MongoDB (recommended for starter), optional AI backend.
- Clone and install
  - `git clone <your-repo-url>`
  - `cd apps/smart-site-starter`
  - `pnpm install`
- Env file
  - `cp .env.example .env.local`
  - Update `DATABASE_PROVIDER=mongoose`, `DATABASE_URL`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_URL`, and optional AI vars.
  - Don’t have a DB? Create a free MongoDB Atlas cluster: https://www.mongodb.com/cloud/atlas. Copy the connection string into `DATABASE_URL`.
  - Need secrets? The agent can generate them (e.g., `PAYLOAD_SECRET`, `PREVIEW_SECRET`) and populate `.env.local` for you.
- Run dev
  - From app dir: `pnpm dev`
  - From repo root: `pnpm --filter @product-studio/smart-site-starter dev`
- Open
  - Frontend: `http://localhost:3000`
  - Admin: `http://localhost:3000/admin` (auto-login in dev if `PAYLOAD_ADMIN_EMAIL`/`PAYLOAD_ADMIN_PASSWORD` set)

Agent runtime etiquette (dev server)

- The user is responsible for running/stopping the dev server.
- Do not run `pnpm dev` or restart the server as the agent; if a restart is required, instruct the user with the exact command.

Cloud storage (Vercel Blob) — optional but recommended

- Create a Vercel account: https://vercel.com/signup
- Create a Blob storage token
  - Go to Vercel Dashboard → Storage → Blob → Tokens → Create Token → choose Read-Write.
  - Copy the token value.
- Add token to env
  - In `.env.local`, set `BLOB_READ_WRITE_TOKEN=<your-token>` (or `VERCEL_BLOB_TOKEN=<your-token>`).
- Enable Vercel Blob in config
  - In `src/smartsite.config.ts`, set:
    - `collections: { media: { provider: "vercel-blob" } }`
  - Keep other collections unchanged.
- Verify
  - Restart dev server; open `/admin` and upload a media item. It should store via Vercel Blob.

# Git Basics (no prior experience)

- Initialize and first commit
  - `git init && git add . && git commit -m "chore: init starter"`
- Create a feature branch
  - `git checkout -b feat/homepage-hero`
- Make commits (Conventional Commits)
  - `git add . && git commit -m "feat: add hero-split section"`
- Push and open a PR
  - `git remote add origin <your-repo-url>`
  - `git push -u origin feat/homepage-hero`
- Fix common issues
  - Undo last commit, keep changes: `git reset --soft HEAD~1`
  - Discard local changes: `git reset --hard`
  - Resolve merge conflicts: open files with `<<<<<<<` markers, edit, then `git add` + `git commit`

# Git Practices & Workflow (Agent Rules)

- Ask-first policy
  - Always propose intended Git actions (branch name, commit message, push target) and wait for confirmation before executing.
- Branch per task
  - Create a focused feature branch for a cohesive unit of work (e.g., `feat/hero-and-cards`, `fix/uri-collision`).
  - Don’t create extra branches for routine, low-risk edits like adding a single section or small style tweaks; keep them in the current feature branch.
  - If direction changes or scope expands, propose a new branch to preserve history (e.g., `feat/alt-hero-animation`).
- Commit granularity
  - Make small, cohesive commits that contain a single logical change. Do not mix refactors with new features in one commit.
  - Separate commits for: section scaffolding, registration wiring, styling tweaks, config changes, and GSAP behavior.
- Conventional commits
  - Use `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `deps:` prefixes; include concise scope (e.g., `feat(sections): add hero-split block`).
- Checkpoints
  - Recommend a commit when a unit of work passes lint/type-check or renders correctly (e.g., a section compiles and appears in admin).
  - If an experiment may be discarded, suggest committing to a `spike/` branch or use `git stash` with a clear message (ask first).
- Pivoting and safety
  - On sudden direction change, suggest: commit current work, create a new branch, and continue there to keep diffs reviewable.
  - For risky or wide-reaching edits, offer to branch off a fresh base (`git switch -c spike/cache-invalidation-poc`).
- Hygiene
  - Never commit secrets; verify `.env*` files are ignored. Review diffs to ensure no accidental admin folder changes that violate starter rules.
  - Keep PRs atomic and link to the user’s request/issue; avoid bundling unrelated changes.

Pragmatic simplicity

- Keep Git simple for the user. Default to a single feature branch per broader task and avoid branching for every small change.
- Reserve extra branches for:
  - Destructive or wide-reaching changes (routing/cache patterns, renames, design tokens overhaul)
  - Experiments/spikes with uncertain outcomes
  - Hotfixes against production or parallel streams that will PR separately
- Stage only relevant files and avoid noisy commits, but don’t micro-commit every keystroke. Aim for understandable checkpoints.
- Narrate planned Git actions and ask first before switching branches or force-pushing.

# Testing & Quality Gates (Agent Rules)

- Type safety first
  - After any significant edit, run `pnpm type-check`. Do not proceed with additional features while type errors exist; resolve them immediately.
- Lint and build sanity
  - Run `pnpm lint` (or `pnpm lint:fix` when appropriate). For larger changes, run `pnpm build` to catch integration issues early.
- Tests when available
  - If tests exist for the touched surface, run them. If the codebase has no tests in this area, don’t introduce a new framework; instead, validate via type checks, build, and manual verification steps.
- No hacks or workarounds — ever
  - Do not monkey‑patch `node_modules`, import private internals, or bypass documented APIs. Follow package‑recommended patterns (e.g., import GSAP via `@/providers/gsap`, use the routing engine and cache helpers, rely on generated types).
  - If a limitation is encountered, propose a proper extension or upstream fix (config/extension/plugin/PR) rather than a workaround.
  - Never construct URIs manually, never hand‑roll Payload types, never fetch from client components, and never edit `src/admin/` in this starter.

Pre-push checklist (agent proposes, asks to run)

- `pnpm type-check` — must pass
- `pnpm lint` — clean or `pnpm lint:fix` applied
- `pnpm build` — compiles successfully
- Smoke test the changed view (if UI-affecting)
- Ensure no secrets or admin changes in the diff; commit messages follow Conventional Commits

# Project Layout Map

- Config entry point: `src/smartsite.config.ts`
- Sections: `src/components/sections/` (two-file pattern + dual registration)
- Extensions: `src/extensions/` (collections, blocks, globals, plugins)
- Frontend route handler: `src/app/(frontend)/[[...uri]]/page.tsx`
- Frontend styles: `src/app/(frontend)/css/` (`base.css`, `globals.css`, `utilities.css`, `components.css`, `ui.css`, `theme.css`, `typography.css`)
- Do not touch: `src/admin/` (auto-replaced on updates)

# Coding Conventions & Naming

- TypeScript-first; 2-space indentation; kebab-case files/folders.
- Prefer named functions over arrows (callbacks excepted).
- Use mini headers instead of inline comments to separate logical groups.
- Sections live in `src/components/sections/<kebab-slug>/{config.ts,Component.tsx}`.
- Do not export general utilities from server action files; follow App Router patterns.
- Never hand-roll Payload types; let Payload generate.
- DO NOT add inline comments within code.

Mini header pattern

```ts
/**
 * Component props
 */
interface HeroProps {
  /* ... */
}

/**
 * Normalize and forward submit
 */
function handleSubmit() {
  /* ... */
}

/**
 * Typing indicator
 */
function TypingIndicator() {
  /* ... */
}
```

Sub-block headers (JSDoc-style, no tags)

- Use short, title-only JSDoc blocks to mark logical sub-sections, matching the chat panel style.
- Do not include `@param`/`@returns` tags; keep them as compact labels.

```ts
/**
 * Component props
 */
interface ChatMessagesProps {
  messages: any[]
  status: string
  regenerate: () => void
  onQuickSend: (text: string) => void
}

/**
 * Assistant typing indicator (three bouncing dots)
 */
function TypingIndicator() {}
```

# Run, Build, Seed

- Dev: `pnpm dev`
- Type-check: `pnpm type-check`
- Lint: `pnpm lint` or `pnpm lint:fix`
- Build: `pnpm build` (generates GraphQL schema and sitemap, then Next build)
- Start (prod): `pnpm start`
- Fresh dev (reset DB + seed + dev): `pnpm dev:fresh`
- Seed dev content: `pnpm seed` (calls `/api/seed`)
- Regenerate URIs: `pnpm regenerate-uris`

# Technical Architecture

- `src/smartsite.config.ts` — User configuration entry point
- `src/admin/config/defaults.ts` — Complete configuration schema
- `src/admin/config/resolver.ts` — Configuration resolution engine
- `src/admin/payload/payload.config.ts` — Main Payload configuration
- `src/app/(frontend)/[[...uri]]/page.tsx` — Dynamic route handler

Main flow

```ts
// 1) User configuration
const config: UserConfig = {
  collections: { services: { enabled: false } },
  features: { ai: { enabled: true } },
}

// 2) Resolver merges with defaults
resolveConfiguration(config)

// 3) Frontend request → URI lookup → render
// /about → [[...uri]]/page.tsx → URI Index → render
```

What you get

- O(1) URI resolution
- Field-driven architecture
- Smart caching with dependency tracking
- Section isolation
- Safe admin updates
- AI integration hooks

# SmartSite Config Guide (`src/smartsite.config.ts`)

- Collections: enable/disable frontend exposure and SEO for each collection.
- Features: toggle AI, sitemaps, dark mode, etc.
- Admin: theme colors, title, metadata.
- Images: quality presets and sizes.
- GSAP plugins: enable `scrollTrigger`, `scrollSmoother`, others; provider loads plugins based on these flags.
- Extensions: add custom collections, blocks, globals, plugins.

Example

```ts
import type { UserConfig } from "@/admin/config"

export const config: UserConfig = {
  collections: {
    pages: { enabled: true, frontend: true, seo: true },
    services: { enabled: false },
  },
  features: {
    ai: { enabled: true, endpoint: process.env.NEXT_PUBLIC_AI_URL },
    sitemaps: true,
  },
  admin: {
    theme: { colors: { accent: "#4f37fb" } },
    meta: { title: "Client Admin" },
  },
  images: {
    quality: { default: 85 },
    sizes: [
      { name: "thumbnail", width: 300 },
      { name: "large", width: 1400 },
    ],
  },
  gsap: {
    scrollTrigger: true,
    scrollSmoother: false,
  },
  extensions: {
    collections: [],
    blocks: [],
    globals: [],
    plugins: [],
  },
}
```

# Config vs Extensions vs Custom Code

Use this decision guide to choose the right lever, mirroring how the master Smart Site is built.

- Use smartsite.config.ts when
  - Toggling collections on/off or exposing them to the frontend (`collections.<name>.enabled`, `frontend`, `seo`, `frontendOptions`).
  - Changing feature flags (`features.ai`, `features.search`, `features.sitemaps`, `features.analytics`, `features.darkMode`, `features.i18n`).
  - Adjusting admin theme/meta (`admin.theme`, `admin.meta`).
  - Configuring images (`images.quality`, `images.sizes`, `images.breakpoints`).
  - Enabling GSAP plugins (`gsap.scrollTrigger`, `gsap.scrollSmoother`, etc.).
  - Breadcrumb behavior (`breadcrumbs.enabled`, `homeLabel`, `separator`).

- Use extensions (src/extensions) when
  - Adding a new collection or global that doesn’t exist yet (e.g., `products`, `events`, `integrations`).
  - Adding reusable blocks/sections to the CMS library for authors to use across pages.
  - Registering Payload plugins (forms, search, SEO customizations).
  - Overriding or augmenting admin UI via supported extension points (without editing `src/admin/`).

Extensions registry steps

- Implement your extension:
  - Collections → `src/extensions/collections/<slug>.ts`
  - Blocks → `src/extensions/blocks/<slug>.ts`
  - Globals → `src/extensions/globals/<slug>.ts`
  - Plugins → `src/extensions/plugins/<slug>.ts`
- Export in `src/extensions/index.ts` registry under the matching map (`collections`, `blocks`, `globals`, `plugins`).
- Declare the slug in `src/smartsite.config.ts` under `extensions.{collections|blocks|globals|plugins}` arrays.
- For new collections that render on the frontend, also add a `collections.<slug>` entry in `smartsite.config.ts` with `enabled: true` and `frontend: true` (and optional `seo` + `frontendOptions`).
- The resolver will include the extension and apply the frontend wrapper automatically (slug field, SEO fields, preview/live preview, and standard hooks).

- Use custom code (frontend app) when
  - Building UI components, hooks, providers, utilities in `src/components`, `src/hooks`, `src/providers`, `src/lib`, `src/utilities`.
  - Creating API endpoints for non-page concerns: `src/app/(frontend)/api/<name>/route.ts`.
  - Wiring animations with GSAP via the provider and scoped selectors.

Compatibility and safety

- The starter mirrors the master Smart Site configuration model. Prefer changes via config and extensions to keep upgrades safe.
- Avoid editing generated types, URI engine internals, or admin files. Keep section slugs and interface names stable to preserve existing content.
- System collections (`uri-index`, `users`, `templates`) are always included; don’t attempt to disable them.

# CSS & Design System

- Frontend CSS lives in `src/app/(frontend)/css/`
  - Tokens and utilities: `base.css`, `utilities.css`, `theme.css`
  - Global resets and typography: `globals.css`, `typography.css`
  - Components and UI patterns: `components.css`, `ui.css`
- Use Tailwind v4 utilities powered by CSS tokens; prefer tokens over ad‑hoc values.
- For reusable complex patterns, add or adjust classes in `components.css` sparingly.
- Keep admin CSS untouched (`src/admin/css/*`).

Tailwind CSS v4 patterns

- Use design tokens from CSS files before ad-hoc utilities.
- Reuse component classes in `components.css` for complex patterns.
- Prefer flex/grid gap utilities over individual margins.

Examples

```tsx
// Use design tokens
<div className="bg-primary-500 text-white p-content gap-content-sm" />

// Component classes for complex patterns
// components.css
.button-gradient { background: linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500)); }
.card-elevated { @apply p-content rounded-lg bg-white shadow-lg; }

// usage
<button className="button-gradient px-content py-content-sm">Click</button>
<div className="card-elevated">...</div>

// Layout spacing with gaps
<div className="flex flex-col gap-content">
  <h2>Title</h2>
  <p>Description</p>
  <button>Action</button>
  </div>

// Typography: prefer semantic tags; only use display classes when needed
<h1>Title</h1>
<h2 className="display-lg">Large heading</h2>
```

Media component

```tsx
import { Media } from "@/components/fields/media"
;<Media resource={media} className="object-cover" />
```

# Sections: Build & Register (`src/components/sections/`)

Two-file pattern + dual registration

```ts
// src/components/sections/hero-banner/config.ts
export const HeroBanner: Block = {
  slug: "hero-banner",
  interfaceName: "HeroBannerBlock",
  fields: [sectionIntro(), sectionCta()],
}

// src/components/sections/hero-banner/Component.tsx
export function HeroBannerComponent(props: HeroBannerBlock) {
  return <section className="...">...</section>
}

// src/components/sections/config.ts
export const sections = { sectionBlocks: [HeroBanner] }

// src/components/sections/sections-map.tsx
export const sectionsMap = { "hero-banner": HeroBannerComponent }
```

Checklist

- Kebab-case folder name matches `slug`
- Two files only: `config.ts` + `Component.tsx`
- Uses reusable field builders (no duplicates)
- Registered in `sections/config.ts` AND `sections-map.tsx`
- Types are generated, not hand-rolled

# Animations (GSAP)

- Import only from the provided GSAP provider and always scope animations with a container ref. GSAP plugins are toggled via `smartsite.config.ts` → `gsap` flags.

```tsx
"use client"
import { useRef } from "react"
import { useGSAP, gsap } from "@/providers/gsap"

export function FadeInCards() {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      gsap.fromTo(
        "[data-card]", // simple selector, scoped by ref
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: "power2.out" }
      )
    },
    { scope: ref }
  )

  return (
    <div ref={ref} className="grid gap-6">
      <div data-card className="card" />
      <div data-card className="card" />
      <div data-card className="card" />
    </div>
  )
}
```

- ScrollTrigger is available via the provider; configure when needed.

```tsx
import { useRef } from "react"
import { useGSAP, gsap, ScrollTrigger } from "@/providers/gsap"

export function PinHero() {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      gsap.to(ref.current, {
        opacity: 1,
        scrollTrigger: {
          trigger: ref.current,
          start: "top top",
          end: "+=400",
          scrub: true,
        },
      })
    },
    { scope: ref }
  )

  return (
    <section ref={ref} className="opacity-0">
      ...
    </section>
  )
}
```

Guidelines

- Use client components only when interactivity/animation is required.
- Always pass `{ scope: ref }` to `useGSAP`; selectors like `"h1"`, `"[data-card]"` are automatically scoped — avoid `ref.current.querySelector`.
- Prefer transform/opacity properties and add will-change classes where appropriate.
- Keep effects resilient; avoid coupling to brittle selectors.

Plugin toggles (via smartsite.config.ts → gsap)

- Available flags: `scrollTrigger`, `scrollSmoother`, `flip`, `draggable`, `morphSVG`, `drawSVG`, `splitText`, `customEase`, `physics2D`, `textPlugin`.
- Only enable what you need; all imports must still come from `@/providers/gsap`.

# Development Guidelines & Patterns

- Risky files: `src/admin/payload/payload.config.ts`, `src/admin/config/*`, `src/app/(frontend)/[[...uri]]/page.tsx`, `src/smartsite.config.ts`.
- Section creation: two-file pattern only; register in both maps; kebab-case folders.
- Field reuse: use `sectionIntro`, `sectionCta`, `button`, etc.; avoid duplicating field definitions.
- Configuration lives only in `smartsite.config.ts`; do not modify admin.
- Never edit URI Index, cache keys, or route resolution logic.
- App Router only: do not add Pages Router files. Server actions export async functions only and must not export general utilities.
- Use absolute aliases (e.g., `@/components/...`, `@/admin/cache`) rather than long relative paths.

# Risk-Based Development Guidelines

High-impact files

- `src/admin/payload/payload.config.ts` — Main Payload configuration
- `src/admin/config/defaults.ts` — Configuration schema
- `src/admin/config/resolver.ts` — Resolution engine
- `src/app/(frontend)/[[...uri]]/page.tsx` — Frontend routing
- `src/smartsite.config.ts` — User configuration

Recommended patterns

```ts
// Section creation — correct
src/components/sections/hero-banner/
├─ config.ts       // Payload fields
└─ Component.tsx   // React component

// Wrong: single file or wrong location/casing
// src/sections/HeroBanner.tsx
```

```ts
// Field reuse — correct
import { sectionIntro, sectionCta, button } from "@/components/fields"
fields: [sectionIntro({ collapsibleLabel: "Hero Content" }), sectionCta()]

// Wrong: duplicating field definitions
// fields: [{ name: "heading", type: "text" }]
```

```ts
// Configuration — correct: use smartsite.config.ts only
export const config: UserConfig = { collections: { services: { enabled: false } } }

// Forbidden: modifying admin files — changes will be overwritten
// NEVER touch files in src/admin/
```

High-risk modifications (avoid)

- Editing `src/admin/` (all files are replaced on updates)
- Modifying generated types (use Payload’s generator)
- Direct edits to the URI Index
- Changing cache tag patterns/keys arbitrarily
- Altering `[[...uri]]` routing logic

# ⚠️ Admin Layer is OFF-LIMITS (`src/admin/`)

**ABSOLUTELY NO MODIFICATIONS IN `/src/admin/`** — changes will be overwritten by updates. Use config and extensions only.

- Never modify, add, or delete files in `src/admin/`.
- Only customize via `src/smartsite.config.ts`, `src/extensions/`, and frontend `src/components/*`.

# Extension System (`src/extensions/`)

Extend and override without touching admin.

```ts
// Directory structure
extensions/
├─ blocks/      // Custom content blocks
├─ collections/ // Custom collections
├─ components/  // Override admin components (when allowed)
├─ globals/     // Custom global configs
└─ plugins/     // Payload plugins

// Register in src/smartsite.config.ts
extensions: {
  collections: [/* custom collection configs */],
  blocks: [/* custom blocks */],
  globals: [/* global configs */],
  plugins: [/* payload plugins */],
}
```

Capabilities

- Add custom collections (products, events, portfolios)
- Create custom blocks for unique content types
- Add globals and plugins without touching admin
- Overwrite whole existing collections

# Routing & Cache Essentials

- Never construct URIs manually; rely on the routing engine and URI Index.
- For content fetching in frontend, use the admin data layer/cache helpers provided by the system; avoid direct Payload calls from components. There will likely be an exported getter from teh admin for importing. If not, create one at the section level (server component) using the cache
- When content changes, revalidation happens automatically if the server is running

Conceptual example

```ts
// Generating a URI (conceptual)
// const uri = await routingEngine.generateURI({ collection: "pages", slug: "child", data: { parent: parentId } })
// expect(uri).toBe("/parent/child")
```

URI resolution in practice

```ts
// O(1) URI lookups via universal cache
import { cache } from "@/admin/cache"

const about = await cache.getByURI("/about")
const post = await cache.getByURI("/blog/my-post")

// By slug (collection + slug)
const page = await cache.getBySlug("pages", "home")

// Regenerate the URI index if needed
// pnpm regenerate-uris
```

Cache usage and revalidation

```ts
import { cache } from "@/admin/cache"
import {
  revalidateDocument,
  batchRevalidateDocuments,
  revalidateGlobal,
  revalidateCollection,
  revalidateAll,
} from "@/admin/cache/revalidation"

// Collection query with filters/pagination
const posts = await cache.getCollection("posts", {
  where: { _status: { equals: "published" } },
  sort: "-publishedAt",
  limit: 10,
})

// Revalidate after content changes (hooks/jobs usually handle this)
await revalidateDocument({ collection: "pages", doc, previousDoc, action: "update" })
// Batch operations
await batchRevalidateDocuments({
  operations: [{ collection: "posts", doc, previousDoc, action: "update" }],
})
// Globals
await revalidateGlobal("settings", settingsDoc, previousSettings)
// Collection-wide
await revalidateCollection("posts")
// Emergency only
// await revalidateAll()
```

# Section Auto-Props and Encapsulation

- Each section receives, in addition to its own block fields, these auto-provided props:
  - `document` — the resolved document for the current route (page/post/etc.)
  - `collection` — the source collection slug for `document`
  - `breadcrumbs` — the breadcrumb trail from the URI index
  - `searchParams` — Next.js search params `{ [key: string]: string | string[] | undefined }`
  - `params` — Next.js route params with `uri?: string[]`

- Source: `src/admin/components/render-sections.tsx` spreads block fields and injects `{ document, collection, breadcrumbs, searchParams, params }` into every section.

- Encapsulation principle:
  - Keep logic within the section using these props where possible (e.g., reading `params`/`searchParams`, deriving state, conditional rendering).
  - For extra data needs, use server components and fetch via `@/admin/cache` in the section; split into a server wrapper + client child for interactivity.
  - Favor self-contained sections over page-level wiring, while still reusing shared UI/components where appropriate.

# Data & CMS Flow

- Edit content in Payload admin (`/admin`): pages, posts, globals (header/footer).
- Frontend collections are configured; their fields map predictably to component props.
- Slug or parent changes cascade via jobs and auto-redirects; avoid manual edits.

Utility helpers

```ts
// Globals
import { getGlobal, getSettings } from "@/admin/data/globals"
const header = await getGlobal("header")
const settings = await getSettings()

// Posts
import { getRecentPosts } from "@/admin/data/posts"
const recentPosts = await getRecentPosts({ limit: 6 })

// Direct cache access for collections
import { cache } from "@/admin/cache"
const pages = await cache.getCollection("pages", {
  where: { _status: { equals: "published" } },
  limit: 10,
})
```

Data patterns

```tsx
// Section components typically use props only
export function TeamGridComponent(props: TeamGridBlock) {
  const { heading, description, teamMembers } = props
  return (
    <section>
      <h2>{heading}</h2>
      <p>{description}</p>
      <div className="grid gap-8 md:grid-cols-3">
        {teamMembers?.map(m => (
          <TeamCard key={m.id} member={m} />
        ))}
      </div>
    </section>
  )
}

// When a section needs dynamic data not in fields
export async function RecentTeamComponent(props: RecentTeamBlock) {
  const { heading, description, limit = 6 } = props
  const teamMembers = await cache.getCollection("team", {
    where: { _status: { equals: "published" } },
    sort: "-createdAt",
    limit,
  })
  return (
    <section>
      <h2>{heading}</h2>
      {teamMembers.map(m => (
        <TeamCard key={m.id} member={m} />
      ))}
    </section>
  )
}

// Layout components fetch globals
export async function Header() {
  const header = await getGlobal("header")
  const settings = await getSettings()
  return (
    <header>
      <nav>
        {header.navigation?.map(item => (
          <CMSLink key={item.id} {...item} />
        ))}
      </nav>
    </header>
  )
}

// Client components receive data as props
;("use client")
export function InteractivePostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(false)
  return (
    <article>
      <h3>{post.title}</h3>
      <button onClick={() => setLiked(!liked)}>{liked ? "Unlike" : "Like"}</button>
    </article>
  )
}
```

# AI Integration (optional)

- Configure backend URL via `NEXT_PUBLIC_AI_URL`.
- Tool/agent IDs must match between admin UI and backend; do not rename once shipped.
- Validate tool inputs/outputs with zod schemas on the backend; respect abort signals for long ops.

# Common Tasks Cookbook

- Install and run locally
  - `pnpm install && cp .env.example .env.local && pnpm dev`
- Access admin and login
  - Visit `/admin`; in dev, auto-login uses `PAYLOAD_ADMIN_EMAIL` and `PAYLOAD_ADMIN_PASSWORD`.
- Create a new section
  - Create folder: `src/components/sections/hero-split/`
  - Add `config.ts` and `Component.tsx`; use reusable field builders
  - Register in `sections/config.ts` and `sections-map.tsx`
  - Restart dev server
- Add an animation to a section
  - Convert component to client (`"use client"`), add a container ref
  - Use `useGSAP` with `{ scope: ref }`; prefer transform/opacity
- Change site colors/typography
  - Adjust tokens in `src/app/(frontend)/css/theme.css` and `typography.css`
- Add a new collection (without touching admin)
  - Define in `src/extensions/collections/` and register via `src/smartsite.config.ts`
- Update a page’s URL safely
  - Change slug in admin; routing engine creates redirects; revalidate
- Fix types not generating
  - Ensure Payload is running and DB connected; run `pnpm generate:types`
- Resolve stale content
  - Use revalidation helpers with `doc` and `previousDoc`; verify published status

# Troubleshooting

- Sections not appearing
  - Confirm export and registration in `sections/config.ts` and `sections-map.tsx`; restart dev
- URI failures
  - Use the routing engine; avoid manual strings; regenerate URIs with `pnpm regenerate-uris`
- Types not generating
  - Run `pnpm generate:types`; verify `PAYLOAD_CONFIG_PATH` and DB connection
- Stale content
  - Revalidate with `doc` and `previousDoc`; check published status
- Sitemaps empty
  - Ensure collections have `frontend: true` (and `seo: true` if needed). Check collection `sitemap` settings in config.
  - Run `pnpm generate:sitemap` to regenerate the sitemap index.
  - If needed, invalidate sitemap cache tags using admin revalidation or `revalidateTag("sitemap:all")` from a maintenance script.
- AI tool not rendering
  - Tool name matches backend; handle all status types; confirm `NEXT_PUBLIC_AI_URL`
- Admin CSS issues
  - Do not change admin CSS import order; keep admin untouched

# Safeguards Recap

- Do not touch `src/admin/` in this starter.
- Sections use two-file pattern and dual registration.
- Never construct URIs manually.
- Never hand‑roll types; generate via Payload.
- Prefer server components; scope GSAP in client components.
- Keep tool/agent IDs stable once shipped.

# Command Reference (starter)

- From app directory (`apps/smart-site-starter`)
  - `pnpm dev` — run dev server on `3000`
  - `pnpm build` — generate GraphQL schema + sitemap, then Next build
  - `pnpm generate:graphql:schema` — regenerate GraphQL schema
  - `pnpm generate:sitemap` — regenerate sitemap index
  - `pnpm start` — start production server
  - `pnpm seed` — seed minimal data via `/api/seed`
  - `pnpm regenerate-uris` — rebuild the URI index
  - `pnpm type-check` — TypeScript type checking
  - `pnpm lint` / `pnpm lint:fix` — linting
  - `pnpm dev:fresh` — reset DB schema + seed + dev
  - `pnpm kill` — free port 3000 if stuck

- From repo root
  - `pnpm --filter @product-studio/smart-site-starter dev`
  - `pnpm --filter @product-studio/smart-site-starter build`

# Links & Pointers

- README in this folder: installation, architecture, routing & caching, AI integration.
- Key paths
  - Config: `src/smartsite.config.ts`
  - Sections: `src/components/sections/`
  - Extensions: `src/extensions/`
  - Frontend CSS: `src/app/(frontend)/css/`
  - Admin (read-only here): `src/admin/`
