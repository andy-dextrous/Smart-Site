# Coding Standards

- folders and files use kebab-case, except established framework/generated names and the section `Component.tsx` convention
- use named functions, not module-level arrow functions
- use full-width block headers for major sections in large files
- use lighter JSDoc-style block headers for related groups of hooks, helpers, constants, or render logic
- explain non-obvious invariants with concise comments
- use `@/...` imports in application TypeScript; CSS and portable scripts use appropriate relative paths
- never create Payload types manually without explicit approval
- use Next.js App Router only

These standards are the canonical rules for SmartSite implementation work.

---

## 7. Design System Operations

Anchor responses in [docs/engineering/design-system.md](design-system.md).

- **Token taxonomy:** explain human-controlled vs derived tokens across `spacing.css`, `typography.css`, `colors.css`, `theme.css`.
- **Safe adjustments:** modify only the first `@theme` block; keep derived tokens consistent with their documented inputs. Encourage small, tested changes.
- **Typography:** use `text-h*`, body scale utilities, and the `RichText` component. No custom pixel values.
- **Spacing:** use section/content/grid/control ladders, container utilities, and Section Settings overrides.
- **Colour schemes:** rely on Section Settings and palette tokens (`text-primary-500`, `bg-neutral`, `border-dark-border`).
- **Site overrides:** override inputs in each site’s theme files while keeping token names consistent.
- **Validation:** suggest using design previews, checking fluid behaviour at min/max widths, and running lint/type-check after updates.

If users request unsupported tokens, advise adding them as new human-controlled inputs with documentation updates.

---

## Source layout

The site owns every source file. Edit the module responsible for the behavior; there is no protected framework layer or extension registry.

| Responsibility | Location |
| --- | --- |
| Native Payload assembly | `src/payload.config.ts` |
| Collections, globals, fields and hooks | `src/payload/collections`, `src/payload/globals`, `src/payload/fields`, `src/payload/hooks` |
| CMS layout, navigation, widgets and styling | `src/components/cms` |
| URI index, public rendering, caching and publication recovery | `src/lib` |
| Native MCP transport and checked content operations | `src/payload/mcp` |
| Database, email, storage adapters and legacy jobs | `src/payload` |
| Sections and reusable frontend components | `src/components` |
| Browser-safe presentation choices | `src/site.config.ts` |
| Generated content types | `src/payload-types.ts` |

Register collections once in `payload.config.ts`. Their definitions own access, fields, hooks and explicit website metadata. See [native configuration](configuration-system.md) for a complete collection example. Import generated types from `@/payload-types`. Keep credentials and server configuration out of browser modules.

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
- For animations, follow global data attributes or GSAP provider patterns (`@/components/providers/gsap`), scoping via refs.

### 8.4 Registration & QA

- Export the block in `sections/config.ts` and component in `sections-map.tsx`.
- Run `pnpm lint` and `pnpm type-check`; manually verify at min/max breakpoints.
- Document reusable section examples inside this repository.

---

## 9. Decision Trees (If–Then Catalog)

Use these “if this, then that” rules to route requests quickly. Prefer canonical docs over the preserved manuscript when citing operational guidance.

- Setup & Environment
  - Use the pinned Node 24 and pnpm versions from [getting started](../workflows/getting-started.md), matching the machine architecture.
  - For a fresh project, run bootstrap; for a configured project, inspect doctor and resume its owned runtime.
  - Preserve existing environment files and project data. Diagnose identity or credential mismatches before retrying.
  - If a port is occupied, inspect ownership; never kill an unrelated process.
  - If MCP is unavailable, check server readiness, the project connection and the client's reconnect/trust state.
  - Bootstrap creates essentials only. Author requested business content through MCP; there is no seed or AI-key rotation workflow.

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
  - If the section repeats across multiple pages → consider a local Template or reusable section.
  - If interactivity is required (e.g., sliders) → split client logic to a colocated client module and lazy-load.
  - If payload fields duplicate existing factories → replace with shared field presets.
  - If no existing field fits the brief → add minimal new fields to the section schema rather than bending an unrelated preset; promote to a shared pattern only if the same need repeats across sections.

- Animations
  - If global reveals are enabled → prefer `data-animate` attributes with `data-animate-target` and a single stagger IF the animation requirement is simple.
  - If bespoke timelines are needed → add `"use client"` locally and use `@/components/providers/gsap` (`useGSAP`, scoped refs, cleanup).
  - If the whole section’s layout/behaviour depends on hooks or coordinated timelines → mark the entire section `"use client"` (acceptable); keep the surface lean and scoped.
  - If any GSAP effects/plugins are requested → enable via config, register once in the GSAP provider. You have the full suite of plugins available via config.
  - If performance suffers → disable global animations or reduce distances/durations; prefer transforms and opacity.

- Routing & Caching
  - If a live page 404s after a slug change → inspect the durable publication work and redirects; retry failed work after repairing its cause.
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

- Agent content access
  - Use the official MCP endpoint and checked SmartSite tools. Reconnect missing clients using the local startup instructions. No chat subscription or hosted AI account is required.

- Deployment
  - If building for production → run `pnpm build`; ensure environment variables mirror staging; connect Mongo Atlas.
  - If content differs between environments → follow the explicit first-launch transfer or approved backup/restore procedure.

- Troubleshooting
  - If lint fails → fix reported files; do not disable rules.
  - If type-check fails → import generated Payload types; avoid manual type invention.
  - If styling is inconsistent → replace ad hoc utilities with token utilities; verify against design system.

---
