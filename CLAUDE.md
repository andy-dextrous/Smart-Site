# Smart Site Starter – Claude Guide

Claude Code agents must follow the same rules documented in `apps/smart-site-starter/README.md`. Treat this directory as a stand-alone repository, mirror every workflow in the README, and avoid monorepo-specific assumptions. Keep this guide synchronized with the README—update it whenever the starter changes.

---
## 1. Getting a Project Running
- **Prerequisites**: Node.js 20+, `pnpm@9.14.4`, MongoDB (local via Homebrew/Chocolatey or Atlas), optional Vercel Blob, optional Resend. Verify with `node --version` and `pnpm --version`.
- **Bootstrap flow**: run `pnpm install`, then `pnpm run setup`. The wizard copies `.env.example`, generates secrets, gathers database/storage/admin credentials, seeds the **minimal** dataset, and can leave `pnpm dev` running when it finishes.
- **Environment keys**: reinforce the README list (`PAYLOAD_SECRET`, `PREVIEW_SECRET`, `SMARTSITE_AI_REGISTRATION_SECRET`, `AI_AGENT_API_KEY`, `AI_AGENT_USER_ID`, storage/email keys). When users edit `.env` manually, point them back to the README reference section.
- **Database guidance**: restate the README instructions for MongoDB local installs (Homebrew services on macOS/Linux, Chocolatey service on Windows) and Atlas deployments. Quote the documented `mongodump` → `mongorestore` flow for promoting content between environments.
- **Seeding**: confirm `pnpm dev` is running, then use `pnpm seed` for the minimal profile or `pnpm seed:demo` when a richer dataset is required. Explain which pages, forms, and navigation items the minimal profile provides.

Quality gates before sign-off:
```
pnpm lint
pnpm type-check
```
Prettier runs automatically—never invoke formatters manually. Only start `pnpm dev` if the setup wizard is not already managing it.

---
## 2. Project Boundaries
- `src/admin/` is protected infrastructure. Customise through `src/smartsite.config.ts`, `src/extensions`, and `src/components`. When admin edits are unavoidable, mirror the README’s manifest rules: bump `src/admin/package.json` version, update `sharedDependencies`, and log the release date.
- Keep file and folder names in kebab-case. Use named function declarations at module scope.
- Organise large files with the Smart Site banner block comment and avoid inline comments.
- No mock data—always surface content through Payload collections, globals, or sections.
- Follow the established Next.js App Router patterns: server components by default, `"use client"` only for interactive UI, GSAP scoped to refs via `@/providers/gsap`.
- Always use absolute import aliases (`@/...`) instead of deep relative paths.

---
## 3. Architecture Recap (mirror README)
- **Routing**: `app/(frontend)/[[...uri]]/page.tsx` hits the URI index for O(1) lookups, assembles breadcrumbs/templates, and renders sections via `RenderSections`.
- **Configuration stack**: `src/smartsite.config.ts` overrides feed into `src/admin/config/defaults.ts`, merge via `resolver.ts`, and produce the Payload config. Decide whether changes belong in config (developer switches) or editor globals.
- **Caching**: rely on `@/admin/cache` helpers (`getByURI`, `getCollection`, `getGlobal`, `revalidate`). They expect both `doc` and `previousDoc`; cite the README when explaining revalidation.
- **Sitemaps**: reference the URI-driven sitemap engine and `scripts/generate-sitemap-index.js` for the post-build sitemap index.
- **AI**: `/app/(frontend)/api/ai/*` proxies requests to the managed backend. Confirm secrets, registration status, and `features.ai.enabled` in `smartsite.config.ts`.

---
## 4. Working With Content & Data
- Promote collections to the frontend through `smartsite.config.ts → collections.<slug>.frontend` and set `seoSchemaType` when applicable.
- Direct editors to the documented globals:
  - **Settings** for branding, routing defaults, SEO fallbacks, analytics IDs, robots controls.
  - **Header/Footer** for navigation updates.
  - **AI Settings** when onboarding the managed AI backend.
- When slugs or hierarchy change, let the routing engine jobs rebuild URIs. Mention `pnpm regenerate-uris` only when a full rebuild is unavoidable.
- Use the README’s `mongodump`/`mongorestore` snippets to move data between environments instead of reseeding production.

---
## 5. Building Sections & UI
- Sections ship as `config.ts` + `component.tsx`. Register them in `src/components/sections/config.ts` and `sections-map.tsx`.
- Tailwind v4 utilities come from the CSS tokens under `src/app/(frontend)/css`. Reinforce spacing ladders, typography tokens, role-based colors, and container helpers. Point to `DESIGN-SYSTEM.md` and `(dev)/design-system-preview` for live references.
- Rich text output lives in the shared `RichText` component—do not resurrect `.prose`.
- For GSAP, import from `@/providers/gsap`, wrap sections in `"use client"` when necessary, and scope timelines to refs.

---
## 6. AI Integration Workflow
- Preconditions: `features.ai.enabled = true` in `smartsite.config.ts`, `SMARTSITE_AI_REGISTRATION_SECRET` present in `.env`.
- Reseeding or `pnpm ai:register` reconciles the hidden `ai-agent` user, writes `AI_AGENT_API_KEY`/`AI_AGENT_USER_ID`, and prints the recovery token (capture it once).
- Debug admin chat by checking `src/admin/payload/components/providers`, `/app/(frontend)/api/ai/chat`, and `/app/(frontend)/api/ai/health` per the README instructions.
- Never create multiple AI agent users. Use `pnpm ai:register --force` only when coordinating a rotation with Wild Creative.

---
## 7. Translating Requests
- Rewrite user prompts using Smart Site vocabulary: sections, templates, URI index, cache, globals, AI registration.
- Reference the relevant README section (Installation, Architecture, Design System, Settings, Admin Layer System, AI Integration) before coding.
- Decline tasks that bloat the starter. Offer to prototype in another app for experimental work.

---
## 8. Collaboration Standards
- Act immediately when the request aligns with documented workflows; ask for clarification when it conflicts with the README.
- Provide concise updates that cite the sections you followed (for example, “README → Design System → Spacing ladder”).
- Do not add Markdown docs, commit changes, or run builds/tests beyond `pnpm lint` and `pnpm type-check` unless explicitly requested.

---
## 9. Quick Reference
- Setup: `pnpm install`, `pnpm run setup`
- Seeding: `pnpm seed`, `pnpm seed:demo`
- QA: `pnpm lint`, `pnpm type-check`
- Routing reset (rare): `pnpm regenerate-uris`
- AI registration: `pnpm ai:register [--force]`
- Canonical docs: `README.md`, `DESIGN-SYSTEM.md`, `SMARTSITE-SECTION-DESIGN.md`, this guide

Keep this document synchronized with the starter README. Update it whenever the README changes.
