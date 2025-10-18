# Smart Site Starter – Agent Playbook

This starter ships as the canonical Smart Site template. Every response should assume the user cloned **only** `apps/smart-site-starter/` into its own repository and is following the instructions in `README.md`. Stay in sync with that file—quote it, reinforce it, and never contradict it.

---
## 1. Getting a Project Running
- **Prerequisites**: Node.js 20+, `pnpm@9.14.4`, access to MongoDB (local via Homebrew/Chocolatey or Atlas), optional Vercel Blob, optional Resend. Verify with `node --version` and `pnpm --version`.
- **Bootstrap flow**: run `pnpm install`, then `pnpm run setup`. The wizard copies `.env.example`, generates secrets, requests database/storage/admin credentials, seeds the **minimal** dataset, and can leave `pnpm dev` running on port 3000.
- **Environment keys**: the README lists every variable written by the wizard. Highlight `SMARTSITE_AI_REGISTRATION_SECRET`, `AI_AGENT_API_KEY`, and `AI_AGENT_USER_ID`; re-run the seed or `pnpm ai:register` if they are missing.
- **Database**: summarize the README’s MongoDB setup for macOS/Linux (Homebrew services), Windows (Chocolatey service), and Atlas (production/staging). Reference the documented `mongodump` ⇄ `mongorestore` promote flow when users need data parity.
- **Reseeding**: confirm the dev server is running, then use `pnpm seed` (minimal) or `pnpm seed:demo` (showcase). Remind editors what the minimal profile contains (Home, Contact, legal pages, default navigation, contact form, global settings).

Required QA before sign-off:
```
pnpm lint
pnpm type-check
```
Never run formatters manually—Prettier is automated. Only start `pnpm dev` yourself when the setup wizard is not already managing it.

---
## 2. Project Boundaries
- Treat `src/admin/` as a protected system. Customise via `src/smartsite.config.ts`, `src/extensions`, and `src/components`. Any admin-layer edits must follow the README’s versioning rules (`src/admin/package.json` → bump version, update shared dependencies).
- Keep file and folder names in **kebab-case**. Reject PascalCase and snake_case directories.
- Use named function declarations at the module level. Reserve arrow functions for callbacks.
- Structure large files with the Smart Site banner block comment and omit inline comments.
- No mock data. All content flows through Payload collections, globals, or sections.
- Stick to the Next.js App Router: default to server components, opt into `"use client"` only for interactivity, and scope GSAP animations to refs via `@/providers/gsap`.
- Use absolute import aliases (`@/...`). Avoid relative paths that climb directories unnecessarily.

---
## 3. Architecture Recap (mirror README)
- **Routing**: `app/(frontend)/[[...uri]]/page.tsx` performs O(1) lookups against the URI index, collects breadcrumbs/templates, and renders sections through `RenderSections`.
- **Configuration stack**: `src/smartsite.config.ts` overrides feed into `src/admin/config/defaults.ts`, merge through `resolver.ts`, and produce the final Payload configuration. Decide whether a request belongs in config (developer flag) or in globals (editor-controlled).
- **Caching**: rely on `@/admin/cache` helpers (`getByURI`, `getCollection`, `getGlobal`, `revalidate`). Revalidation utilities expect both `doc` and `previousDoc`; quote the README when explaining cache behaviour.
- **Sitemaps**: the URI-driven sitemap engine tracks cache tags and generates the sitemap index post-build (`scripts/generate-sitemap-index.js`). Use it when debugging SEO output.
- **AI pipeline**: `/app/(frontend)/api/ai/*` routes proxy to the managed Smart Site AI backend. Ensure registration secrets are present and the seed wrote credentials to `.env`.

---
## 4. Working With Content & Data
- Promote collections to the frontend through `smartsite.config.ts → collections.<slug>.frontend` and optional `seoSchemaType`.
- Direct editors to the documented globals:
  - **Settings** for brand text, routing defaults, SEO fallbacks, analytics IDs.
  - **Header** and **Footer** for navigation; do not hard-code links.
  - **AI Settings** when connecting to the managed backend.
- When slugs or hierarchy change, let the routing engine jobs rebuild URIs. Mention `pnpm regenerate-uris` only for disaster recovery.
- For data migrations, reference the README’s `mongodump`/`mongorestore` script snippets and remind users to avoid reseeding production databases.

---
## 5. Building Sections & UI
- Each section consists of a Payload config (`config.ts`) and a React component (`component.tsx`). Register it in `src/components/sections/config.ts` and `sections-map.tsx`.
- Tailwind v4 utilities are generated from the CSS token system under `src/app/(frontend)/css`. Reinforce:
  - Four spacing ladders (section, content, grid, control).
  - Typography tokens (`text-h*`, `text-body-*`) instead of arbitrary sizes.
  - Role-based color utilities and container helpers (`container`, `container-md`, etc.).
  - `DESIGN-SYSTEM.md` and the `(dev)/design-system-preview` route for live references.
- Rich text output belongs in the shared `RichText` component; do not revive `.prose`.
- For GSAP, import providers from `@/providers/gsap`, gate animations behind media queries when appropriate, and avoid global timelines.

---
## 6. AI Integration Workflow
- Preconditions: `features.ai.enabled = true` in `smartsite.config.ts` and a valid `SMARTSITE_AI_REGISTRATION_SECRET` in `.env`.
- Reseeding or `pnpm ai:register` ensures the hidden `ai-agent` user, writes `AI_AGENT_API_KEY`/`AI_AGENT_USER_ID`, and prints the recovery token (capture it once).
- Admin chat, tool UIs, and status checks live under `src/admin/payload/components/providers`. The README explains how `/api/ai/chat` and `/api/ai/health` proxy requests; point users there when troubleshooting connectivity.
- Never advise creating multiple AI agent users. If rotation is required, follow the `pnpm ai:register --force` guidance and coordinate with Wild Creative.

---
## 7. Translating Requests
- Rephrase user questions with Smart Site terminology: sections, templates, URI index, cache, globals, AI registration.
- Before coding, cite the relevant README section (Installation, Architecture, Design System, Settings, Admin Layer System, AI Integration) so the user knows which canonical rule you are following.
- Decline work that bloats the starter or contradicts the README. Offer to prototype in a separate app if the request is experimental.

---
## 8. Collaboration Standards
- Act immediately when requirements match established patterns; ask only when a request conflicts with documented rules.
- Provide concise updates that mention the sections you followed (for example, “Aligned with README → Design System → Spacing ladder”).
- Do not add extra Markdown docs, commit changes, or run tests/builds beyond `pnpm lint` and `pnpm type-check` unless explicitly asked.

---
## 9. Quick Reference
- Setup: `pnpm install`, `pnpm run setup`
- Seeding: `pnpm seed`, `pnpm seed:demo`
- QA: `pnpm lint`, `pnpm type-check`
- Routing reset (rare): `pnpm regenerate-uris`
- AI registration: `pnpm ai:register [--force]`
- Canonical docs: `README.md`, `DESIGN-SYSTEM.md`, `SMARTSITE-SECTION-DESIGN.md`, this playbook

Keep this file in lockstep with the starter README. When the README changes, update this playbook immediately.
