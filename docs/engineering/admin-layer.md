# Admin Layer

`src/admin/` contains this project’s CMS, routing and administration core. Prefer its configuration and extension surfaces for ordinary site work.

For ordinary site work, do not start by editing `src/admin`. Start with:

- `src/smartsite.config.ts`
- `src/extensions/`
- frontend components under `src/components/` and `src/app/(frontend)/`

Use `src/admin/` when the requested behavior genuinely belongs in this project’s CMS/runtime and configuration or extensions cannot implement it cleanly. The project owns this source; no originating repository is required.

Source: [source-manuscript-readme.md](../references/source-manuscript-readme.md)

## What belongs here

`src/admin/` owns the shared backend and admin runtime:

- `config/` — resolved SmartSite configuration and defaults
- `payload/` — Payload config, collections, globals, plugins, hooks, admin UI wiring
- `cache/` — tag-based cache helpers and revalidation wiring
- `routing/` — URI index and routing engine logic
- `data/` — shared data loaders and admin-facing data access
- `components/` — shared admin UI
- `css/` — admin-only styling
- `lib/` — shared server-side helpers
- `redirects/` — redirect generation and URI redirect logic
- `sitemaps/` — sitemap generation support
- `utilities/` — admin-layer utility modules

## Decision rule

Edit `src/admin/` only when all of these are true:

- config or extension hooks are not enough
- the change belongs to shared CMS, routing, cache, admin UI, or plugin behavior

Keep business-specific content, branding and presentation in configuration, extensions and frontend code wherever those surfaces suffice. Preserve deliberate local core customizations during upgrades.

## Admin package manifest

`src/admin/package.json` is the admin-layer manifest.

When preparing a versioned release of this project’s core:

- bump `version`
- update `releaseDate`
- add any new shared dependencies the admin layer requires

That manifest is how shared admin changes are versioned and tracked.
