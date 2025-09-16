# Smart Site Starter – Agent Playbook

This starter should feel friendly to non-expert builders. Be a proactive teammate: study the project `README.md` first, align with Smart Site conventions, and act decisively once requirements are clear.

---
## 1. Orientation & Setup
- **Always begin with** `pnpm run setup`. The guided CLI:
  - Copies `.env.example` to `.env` when needed
  - Collects the port, database provider/URL, storage preference, and admin credentials
  - Ensures secrets (`PAYLOAD_SECRET`, `PREVIEW_SECRET`) exist
  - Starts the dev server, runs the seeding API, and leaves the server running
  - Prints `🚀 Your Smart Site is ready to build.` on success
- Requirements: Node.js ≥ 20, `pnpm@9.x` (never use npm). Verify with `node --version`, `pnpm --version`.
- If `.env` loses `AI_AGENT_API_KEY` or `AI_AGENT_USER_ID`, re-run the seed so the CLI restores the canonical Smart Site identity.

### Essential commands
```
pnpm install        # dependencies (use after pulling changes)
pnpm run setup      # env + seed flow (interactive)
pnpm dev            # start dev server only if the CLI is not already running it
pnpm lint           # required before sign-off
pnpm type-check     # required before sign-off
pnpm kill           # free ports 3000/3001 if occupied
```
Never run formatters manually (Prettier is automated). Do not start production builds or run tests unless the user explicitly asks.

---
## 2. Repository Boundaries & Safety Rules
- `src/admin/` is **off-limits** in the starter. Customize via:
  - `src/smartsite.config.ts`
  - `src/extensions/` (collections, globals, blocks)
  - `src/components/` (sections, shared components)
- Respect Smart Site’s admin permissions model:
  - Master app (`apps/smart-site/`) can modify admin; starter and client apps cannot.
  - Client implementations under `apps/clients/*` must use `smartsite.config.ts` and extensions only; never touch their admin directories.
- File and folder names **must be kebab-case**.
  ```ts
  // ✅ CORRECT
  src/components/sections/hero-simple/
  // ❌ WRONG
  src/components/sections/HeroSimple/
  ```
- Use **named function declarations**, not top-level arrow functions.
  ```ts
  function processData() {
    // …
  }
  ```
- Organize large files with block comments and **no inline comments**.
  ```ts
  /*************************************************************************/
  /*  SECTION RENDERING LOGIC
  /*************************************************************************/
  ```
- Use absolute import aliases (`@/…`). Stick to the Next.js App Router.
- Server action files (`"use server"`) must export async functions only—no shared utilities.
- Cached helpers should use descriptive names without the word "cache".
- Keep solutions simple and idiomatic; consult existing utilities before inventing new ones.
- Always review existing patterns (utilities, hooks, section examples) before writing new code.
- Place new files in the established folders for that concern (sections, extensions, utilities, etc.).
- Prefer server components; only opt into client components when interactivity demands it, and always scope GSAP to a container ref.
- Never use mock data.
- Avoid hacks or one-off workarounds; deliver clean, maintainable implementations even under time pressure.
- Never create ad-hoc Payload types—run the official generators if necessary.
- Never hardcode URIs; rely on the routing engine, cached `getByURI`, and helpers.
- Do not add extra Markdown docs, commit changes, or run tests/builds unless the user directs you to do so.
- Large files begin with the Smart Site banner comment:
  ```ts
  /*************************************************************************/
  /*  FILE TITLE
  /*************************************************************************/
  ```
- Within files, break major sections with the lightweight JSDOC-like panel style used in the chat components:
  ```ts
  /**
   * Subsection Title
   */
  ```

---
## 3. System Architecture Snapshot
- Catch-all route: `app/(frontend)/[[...uri]]/page.tsx` resolves every URL through the URI index (O(1) lookup). It hands the result to `RenderSections`.
- Configuration stack:
  - `src/smartsite.config.ts` → user overrides
  - `src/admin/config/defaults.ts` → full schema with defaults
  - `src/admin/config/resolver.ts` → merges defaults + overrides
  - `src/admin/payload/payload.config.ts` → generated Payload config
- `RenderSections` injects contextual props (`document`, `collection`, `breadcrumbs`, routing params) into every section. Use `PageData` when you need them.
- Caching utilities live under `src/admin/cache`. Use them for URI and collection lookups.
- Smart Site provides intelligent revalidation hooks; rely on provided helpers before forcing manual invalidation.

### Collection intelligence
- Default collection behaviour lives in `apps/smart-site/src/admin/config/defaults.ts` (`SMARTSITE_DEFAULTS`). Every first-party slug defined there (`pages`, `posts`, `services`, `team`, `testimonials`, `categories`, `media`, `templates`, `users`) starts enabled, so never tell a user they must "turn on" services or testimonials—they already exist unless deliberately disabled.
- System collections (`uri-index`, `users`, `templates`) cannot be removed. The resolver in `src/admin/config/resolver.ts` always registers them to keep routing and admin access intact.
- Plugin collections (`forms`, `form-submissions`, `redirects`, `search`, etc.) arrive through the default plugin stack in `src/admin/payload/plugins`. They appear in `payload-types.ts` automatically and do not need `smartsite.config.ts` entries.
- Use this audit path when you need to describe the current setup:
  1. Inspect `apps/smart-site/src/admin/config/defaults.ts` to understand the baseline.
  2. Review the app-level `src/smartsite.config.ts` for overrides or explicit disables.
  3. Check `src/extensions/index.ts` for custom slugs that replace or extend the defaults.
  4. Confirm Payload’s output in `src/admin/payload/payload-types.ts` to see every registered collection and global.
- Reserve `extensions.collections` for new slugs only. If a collection ships with Smart Site already, configure it via `smartsite.config.ts` instead of duplicating it as an extension.

---
## 4. Component Development Principles
### Styling (Tailwind v4, CSS-first)
- Design tokens live in `theme.css`; reusable component classes go in `components.css`.
- Prefer tokens/variables (`bg-primary-500`, `gap-content`) before composing raw Tailwind utilities.
- Layout stacks should use flex + gap rather than individual margins.
- Padding and typography come from the design system—use the section spacing classes (`px-section-x`, `py-section-y`, etc.) and typography utilities (`prose`, `text-balance`, `font-display`) instead of adding custom `p-*` or `text-*` values inside components.

### GSAP animations
- Mark animated components with `"use client"`.
- Import exclusively from the provider:
  ```ts
  import { useGSAP, gsap } from "@/providers/gsap"
  ```
- Always scope animations with a ref: `useGSAP(() => { … }, { scope: ref })`.
- Animate transforms/opacity, keep durations subtle (≈0.4–0.8s, `power2.out`). Add `will-change` classes to animated elements when appropriate.

---
## 5. Section Creation Guide
1. **Two-file pattern**
   - `config.ts` – Payload block definition; heavily reuse field builders (`sectionIntro`, `richContent`, `button`, etc.).
   - `Component.tsx` – React implementation importing generated types and optionally `PageData`.
2. **Dual registration**
   - Register the block in `src/components/sections/config.ts`.
   - Map the component in `src/components/sections/sections-map.tsx`.
3. **Context props**
   ```ts
   import type { PageData } from "@/admin/components/render-sections"
   export const HeroSimpleComponent: React.FC<HeroSimpleBlock & PageData> = props => {
     const { heading, breadcrumbs, document } = props
     // …
   }
   ```
4. **Field-first philosophy**
   - Use field helpers to enforce consistent structures.
   - Build reusable blocks for rich-text embeds when content should appear inside articles.
5. **Naming**
   - Name by structure, not marketing copy (e.g., `feature-grid`, not `growth-story`).
6. **Layout**
   - Use `section` elements stacked inside `<main>`.
   - Prefer component spacing tokens (`gap-content`, `px-section-x`).

### Fields vs. Blocks vs. Sections
- **Fields** – consistent data sets (heading, CTA, button). Always reuse functions where available.
- **Blocks** – content snippets inside rich text (media embeds, code snippets, inline forms).
- **Sections** – full-width architectural layouts that compose the page.

---
## 6. Data & Caching Patterns
- Fetch via supplied utilities (`getPostsWithPagination`, `cache.getCollection`, `cache.getByURI`). Prefer server components.
- When exposing a collection to the frontend, set `frontend`/`seo` in `smartsite.config.ts` and update `frontendOptions.seoSchemaType` if needed.
- For new collections/globals, create extensions under `src/extensions` and register them; keep generated admin files pristine.
- If manual revalidation or URI regeneration is required, use the provided revalidate utilities (they expect both `doc` and `previousDoc`).
- When consulting framework docs (Tailwind, GSAP, Assistant UI, Payload), use the official sources or the Context7 MCP tools for up-to-date references.

---
## 7. AI Agent Identity
- The Smart Site AI backend treats `AI_AGENT_USER_ID` as the permanent workspace key. **Never create multiple AI agent users.**
- The seeding helper (`ensureAIAgentWithAPIKey`) reuses the existing agent. If `.env` is missing values or the key is disabled, it re-enables API access on the same ID and surfaces the key so `.env` can be updated.
- Downstream requests (chat, threads, schema APIs) send `Authorization: Bearer <AI_AGENT_API_KEY>` and `X-Site-ID: <AI_AGENT_USER_ID>`; breaking this pairing severs the workspace.

---
## 8. Translating User Requests
Use Smart Site terminology and patterns when responding:
- “Add/change a section” → scaffold the two-file section, register it, and follow styling/animation rules.
- “Adjust layout/styling” → leverage design tokens or reusable CSS classes. Avoid ad-hoc styling.
- “Fetch content” → use provided data utilities and keep fetching in server components.
- “Configure navigation/footer” → guide the user to edit the relevant globals via the admin UI.
- “Add a collection or block” → implement through `src/extensions` and register in `smartsite.config.ts`.
- “Enable animations/features” → toggle the relevant flags in `smartsite.config.ts` (e.g., GSAP plugins, breadcrumbs settings).
- “Change data model/collection” → extend the collection under `src/extensions/collections/` and register in `smartsite.config.ts`; never edit admin core.
- “Update a page/URL” → rely on the routing engine and cached helpers; never build paths manually.
- “Types look wrong” → regenerate using the official tooling (`pnpm generate:types` if defined); never handcraft interfaces.
- “Content looks stale” → trigger the provided revalidation helper with both `doc` and `previousDoc`.
- “Create a custom collection (e.g., testimonials, FAQs, products)” → define via extensions, register, optionally build a rendering section, and have the user populate via admin.
- “Create a blog listing page” → reuse the `posts` collection, provide/register a `posts-list` section, and have the user publish a “Blog” page.
- “Expose an existing collection on the frontend” → set `frontend`/`seo` flags in config and let the user add sections referencing it.
- “Add fields to a collection without touching admin” → extend via `src/extensions/collections/` and re-register; user repopulates content.
- “Add a reusable block/section sitewide” → add the block in extensions, build/register the section pair, and instruct the user to place it where needed.
- “Turn on advanced animations (ScrollSmoother, MorphSVG, etc.)” → toggle `smartsite.config.ts → gsap` while keeping imports from `@/providers/gsap`.
- “Change breadcrumbs behavior/labels” → adjust the breadcrumbs config (separator, home label, max depth) centrally.
- “Tweak admin colors/branding” → update `smartsite.config.ts → admin.theme` and `admin.meta`.
- “Optimize image sizes for performance” → tune `smartsite.config.ts → images` options.
- “I want a custom route” → use CMS-driven pages when possible; otherwise build Next.js API routes under `app/(frontend)/api/*`.
- “Add a contact form/email send” → lean on Payload forms or build a tailored API route; clarify validation, storage, and notifications first.
- “Change navigation/footer” → have the user edit the Header/Footer globals; only adjust code when the structure must change.
- “Fix SEO for a page” → leverage SEO fields, canonical URL, and `noIndex`; sitemaps come from the URI index.
- “I changed a slug; now links broke” → allow the routing engine to rebuild redirects, run URI regeneration utilities if necessary, and revalidate the affected content.
- When in doubt, restate the request in Smart Site terms, cite the README or this playbook section you’ll follow, and confirm before coding.

---
## 9. Collaboration Etiquette
- Default to action for well-understood tasks; ask only when ambiguity remains.
- Provide concise updates referencing the sections of this playbook and any README instructions you applied.
- Keep the UI approachable for non-experts—make sensible choices without over-explaining.

---
## 10. Quick Reference
- **Setup**: `pnpm run setup`
- **Admin guardrail**: never edit `src/admin/` in the starter
- **Sections**: two files + two registrations
- **Styling**: use tokens, Tailwind v4 CSS-first approach
- **Animations**: `"use client"`, `@/providers/gsap`, scoped refs
- **Data**: use cache/utilities; avoid client-side fetching for structured content
- **AI identity**: single agent user, env must match DB
- **Docs**: README + this playbook + official library docs

Keep this document beside the project README and revisit it whenever you encounter unfamiliar territory.
