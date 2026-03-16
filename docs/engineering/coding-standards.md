# Coding Standards

- folders and files use kebab-case
- use named functions, not module-level arrow functions
- use full-width block headers for major sections in large files
- use lighter JSDoc-style block headers for related groups of hooks, helpers, constants, or render logic
- never add inline comments
- always use absolute `@/...` imports
- never create Payload types manually without explicit approval
- use Next.js App Router only

These standards are the canonical rules for SmartSite implementation work.

---

## 7. Design System Operations

Anchor responses in [docs/engineering/design-system.md](design-system.md).

- **Token taxonomy:** explain human-controlled vs derived tokens across `spacing.css`, `typography.css`, `colors.css`, `theme.css`.
- **Safe adjustments:** modify only the first `@theme` block; never edit derived tokens. Encourage small, tested changes.
- **Typography:** use `text-h*`, body scale utilities, and the `RichText` component. No custom pixel values.
- **Spacing:** use section/content/grid/control ladders, container utilities, and Section Settings overrides.
- **Colour schemes:** rely on Section Settings and palette tokens (`text-primary-500`, `bg-neutral`, `border-dark-border`).
- **Site overrides:** override inputs in each site’s theme files while keeping token names consistent.
- **Validation:** suggest using design previews, checking fluid behaviour at min/max widths, and running lint/type-check after updates.

If users request unsupported tokens, advise adding them as new human-controlled inputs with documentation updates.

---

## 7.1 Source Layout (Do / Don’t)

Use this as a quick map for where changes belong. Never modify the admin layer.

- `src/admin/` — Protected Payload layer (collections, globals, plugins, cache, CLI wiring). Do not edit here. Use `smartsite.config.ts`, `src/extensions`, and frontend components instead.
- `src/app/` — Next.js App Router.
  - `(frontend)/` — public website routes, API routes for frontend, global CSS, error/not-found, robots/sitemap.
    - `[[...uri]]/page.tsx` — dynamic page renderer (URI index).
    - `api/` — frontend APIs (ai, seed, preview); keep server-only logic.
    - `css/` — Tailwind v4 token sheets (`spacing.css`, `typography.css`, `colors.css`, `theme.css`).
    - `(dev)/` — development-only utilities (e.g., previews, diagnostics).
  - `(payload)/` — admin UI routes. Do not customize here.
- `src/components/` — frontend building blocks.
  - `sections/` — installable/custom sections; each folder has `config.ts` + `Component.tsx`; register in `config.ts` and `sections-map.tsx`.
  - `fields/` — shared field presets and UI components (links, media, rich text, pagination, section wrapper, etc.).
  - `header/`, `footer/`, `ui/`, `posts/`, `icons/`, `logos/` — site chrome and shared UI pieces. Header/footer components wire into the corresponding Payload globals; do not rebuild them as sections.
- `src/extensions/` — user-defined Payload configs (collections/globals/blocks/plugins). Enable via `smartsite.config.ts → extensions`.
- `src/providers/` — GSAP provider, effects, global animation hooks, utilities for motion.
- `src/hooks/` — shared React hooks (client/server where appropriate).
- `src/lib/` — domain loaders and helpers that wrap cache access; prefer here over direct payload calls.
- `src/utilities/`, `src/types/` — misc utilities, shared types.
- `src/smartsite.config.ts` — developer configuration surface (features, gsap, extensions, admin meta).
- `src/proxy.ts` — Next.js proxy handler.

Rules of thumb

- Never touch `src/admin` for ordinary site work; make shared admin changes only when the change truly belongs in SmartSite core.
- Sections live under `src/components/sections/<kebab-name>/` with schema + component colocated.
- Put new shared UI patterns under `components/ui` or `components/fields` so they can be reused.
- Add new Payload entities through `src/extensions` and register slugs in `smartsite.config.ts`.
- Header/footer are managed by dedicated components (`src/components/header`, `src/components/footer`) backed by Payload globals (`globals/header`, `globals/footer`). Never build them as sections; edit the globals in admin or via `smartsite.config.ts`/extensions.

---

### Folder Map (Quick Tree)

```
src/
├── app/
│   ├── (frontend)/
│   │   ├── [[...uri]]/page.tsx          # Dynamic page renderer
│   │   ├── api/                         # Frontend API routes (ai, seed, preview)
│   │   ├── css/                         # Tailwind v4 token sheets
│   │   │   ├── spacing.css
│   │   │   ├── typography.css
│   │   │   ├── colors.css
│   │   │   └── theme.css
│   │   ├── layout.tsx, error.tsx, not-found.tsx, robots.ts, sitemap.ts
│   └── (payload)/                       # Admin UI routes (do not customize)
│       ├── admin/
│       ├── api/
│       └── layout.tsx
├── admin/                                # Protected Payload layer (do not edit)
├── components/
│   ├── sections/
│   │   ├── config.ts                    # Block registry
│   │   ├── sections-map.tsx             # Slug → Component map
│   │   └── <section-name>/
│   │       ├── config.ts                # Payload Block schema
│   │       └── Component.tsx            # React component
│   ├── fields/                          # Shared field presets & UI
│   ├── ui/                              # Reusable UI patterns
│   ├── header/, footer/, posts/, icons/, logos/
├── extensions/                          # User-defined Payload configs
├── providers/                           # GSAP provider, effects, hooks
├── hooks/                               # Shared React hooks
├── lib/                                 # Domain loaders wrapping cache
├── utilities/, types/
├── smartsite.config.ts                  # Developer configuration surface
└── proxy.ts
```

### Most-Edited Files (Quick Links)

- Sections registry: `src/components/sections/config.ts`
- Sections map: `src/components/sections/sections-map.tsx`
- Section wrapper: `src/components/fields/section/component.tsx` (import via `@/components/fields/section`)
- Design tokens: `src/app/(frontend)/css/spacing.css`, `src/app/(frontend)/css/typography.css`, `src/app/(frontend)/css/colors.css`, `src/app/(frontend)/css/theme.css`
- Config surface: `src/smartsite.config.ts`
- GSAP: `src/providers/gsap/global-animations.tsx`, `src/providers/gsap/effects.ts`
- Frontend entry: `src/app/(frontend)/[[...uri]]/page.tsx`
- Generated types (read-only import): `@/admin/payload/payload-types`

Never edit `src/admin/` directly in client projects.

Use `src/extensions/` only when you are introducing a genuinely new slug or capability that does not already exist. If a built-in collection or feature already exists, configure or extend it through `smartsite.config.ts` and the documented extension points instead of duplicating it.

---

### Where to Put Things

| Task / Asset                            | Put it here                                                    | Notes                                                 |
| --------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------- |
| New section (schema + component)        | `src/components/sections/<kebab-name>/`                        | Register in `sections/config.ts` + `sections-map.tsx` |
| Shared UI pattern / building block      | `src/components/ui/` (or `fields/` if tied to CMS fields)      | Keep token utilities and responsive behaviour         |
| Domain loader or complex cache query    | `src/lib/`                                                     | Use `@/admin/cache`; return normalized shapes         |
| New Payload collection/global/block     | `src/extensions/<type>/<slug>.ts` + `src/extensions/index.ts`  | Enable via `smartsite.config.ts → extensions`         |
| Configuration overrides / feature flags | `src/smartsite.config.ts`                                      | Adjust features, GSAP flags, extensions               |
| Design tokens / theme tuning            | `src/app/(frontend)/css/{spacing,typography,colors,theme}.css` | Modify only human-controlled tokens                   |
| Animation utilities / shared effects    | `src/providers/gsap/`                                          | Register global attributes or effects                 |

---

## 8. Section Development Workflow

Ground section work in [docs/engineering/section-development.md](section-development.md) and [docs/engineering/playbook.md](playbook.md).

### 8.1 Planning

- Identify required content, layout, tone, animations, and editor controls.
- Design to the brief precisely; do not shoehorn existing fields/sections.
- Confirm whether a template or Section Settings tweak already solves the need.

### 8.2 Schema (`config.ts`)

- Create a kebab-case folder under `src/components/sections`.
- Use shared field factories (`link`, `buttonsGroup`, `sectionCta`, `richText`, etc.).
- Group fields inside `collapsible` blocks, set defaults, and end with `sectionSettings()`.
- Add `interfaceName` to match generated types; slug must equal folder name.
- Keep schema lean—no speculative toggles.

### 8.3 Component (`Component.tsx`)

- Default to server components; add `"use client"` only when the entire section needs interactivity.
- Wrap markup with `<Section>` and rely on design-system utilities (`gap-content`, `container`, `text-h*`).
- Use `tailwind-variants` (or equivalent) to compute class slots once per render.
- Guard optional content, avoid empty wrappers, leverage shared components (`CMSLink`, `Media`, `RichText`).
- For animations, follow global data attributes or GSAP provider patterns (`@/providers/gsap`), scoping via refs.

### 8.4 Registration & QA

- Export the block in `sections/config.ts` and component in `sections-map.tsx`.
- Run `pnpm lint` and `pnpm type-check`; manually verify at min/max breakpoints.
- If promoting to blocks library, mention mirroring instructions and metadata updates.

---

## 9. Decision Trees (If–Then Catalog)

Use these “if this, then that” rules to route requests quickly. Prefer canonical docs over the preserved manuscript when citing operational guidance.

- Setup & Environment
  - If Node < 20 or pnpm missing → install per [docs/workflows/getting-started.md](../workflows/getting-started.md) → rerun `pnpm install`.
  - If `.env` is missing → run `pnpm bootstrap`, then review `.env`.
  - If `.env` already exists and the site is configured → do not rerun bootstrap unless the user explicitly asks.
  - If you need a fast status check → run `pnpm doctor` before guessing the next command.
  - If AI is intentionally enabled and the credentials are missing/outdated → run `npx smartsite ai rotate --project .`.
  - If port 3000 is busy → stop the other process or run `pnpm kill`, then start dev.
  - If Mongo connection fails → check service status (Homebrew/Chocolatey) or Atlas IP allowlist → verify `DATABASE_URL`.
  - If seeding stalls → ensure `pnpm dev` is running → retry `pnpm seed` or `pnpm seed:demo`.

- Design System
  - If a user asks to “make headings bigger on desktop” → adjust `--fluid-text-base-max` or `--fluid-text-scale-max` in `typography.css` (not per-component overrides).
  - If they want “tighter body text” → lower `--line-height-body` and validate legibility at min/max viewports.
  - If they ask to “increase overall spacing” → raise `--fluid-space-base-min/max` in `spacing.css`.
  - If they want “wider content” → increase container width tokens; do not hard-code `max-w-*` in components.
  - If they try to change derived tokens → block and redirect to human-controlled inputs.
  - If component spacing is ad hoc → replace `mt/mb` with parent `gap-content-*` or `gap-grid-*` as appropriate.

- Sections
  - If creating a new section → scaffold folder (kebab-case), add `config.ts`, `Component.tsx`, register in config + map, end schema with `sectionSettings()`.
  - If the section displays content + image overlay → compute `tone = dark` and apply via variants; use `<Section>` for padding/colour.
  - If the section repeats across multiple pages → consider a Template or a blocks-library promotion.
  - If interactivity is required (e.g., sliders) → split client logic to a colocated client module and lazy-load.
  - If payload fields duplicate existing factories → replace with shared field presets.
  - If no existing field fits the brief → add minimal new fields to the section schema rather than bending an unrelated preset; promote to a shared pattern only if the same need repeats across sections.

- Animations
  - If global reveals are enabled → prefer `data-animate` attributes with `data-animate-target` and a single stagger IF the animation requirement is simple.
  - If bespoke timelines are needed → add `"use client"` locally and use `@/providers/gsap` (`useGSAP`, scoped refs, cleanup).
  - If the whole section’s layout/behaviour depends on hooks or coordinated timelines → mark the entire section `"use client"` (acceptable); keep the surface lean and scoped.
  - If any GSAP effects/plugins are requested → enable via config, register once in the GSAP provider. You have the full suite of plugins available via config.
  - If performance suffers → disable global animations or reduce distances/durations; prefer transforms and opacity.

- Routing & Caching
  - If a live page 404s after a slug change → allow the URI job to rebuild; check redirects; use `pnpm regenerate-uris` only for recovery.
  - If content looks stale → verify cache invalidation on save; confirm you’re not viewing a draft without preview.
  - If sitemap is wrong → re-run build or sitemap generation; check URI index.

- Templates & Settings
  - If editors need a default layout → set Default Page Template in Settings → Routing.
  - If they want to apply a layout to an existing page → use the sidebar “Apply Template” control.
  - If editing a template doesn’t update pages → remind that templates aren’t retroactive; reapply intentionally.
- If navigation changes are requested → update Header/Footer globals; never hard-code links in components.

- Forms & Email
  - If form emails fail → verify `RESEND_API_KEY` and sender domain; submissions still store in collections.
  - If the project doesn’t need email → omit Resend keys; keep form submissions for admin review.

- Media & Storage
  - If images look blurry/heavy → use `<Media>` with appropriate sizes/qualities; avoid inline `<img>`.
  - If storage is not configured → default to local in dev; use the deployment guidance in [docs/workflows/deployment.md](../workflows/deployment.md) for production storage decisions.

- AI Integration
  - If AI features are requested without a subscription → set `features.ai.enabled = false` and proceed without AI.
  - If the workspace is still disabled → confirm the AI agent exists (`npx smartsite ai rotate --project .`) and that Wild Creative has approved the site.
  - If keys are lost → coordinate rotation then `npx smartsite ai rotate --project . --force`.

- Deployment
  - If building for production → run `pnpm build`; ensure environment variables mirror staging; connect Mongo Atlas.
  - If content differs between environments → use `mongodump`/`mongorestore` promotion instead of reseeding.

- Troubleshooting
  - If lint fails → fix reported files; do not disable rules.
  - If type-check fails → import generated Payload types; avoid manual type invention.
  - If styling is inconsistent → replace ad hoc utilities with token utilities; verify against design system.

---
