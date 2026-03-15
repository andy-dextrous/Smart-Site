# Admin Layer

`src/admin/` is the protected SmartSite core.

For ordinary site work, do not start by editing `src/admin`. Start with:

- `src/smartsite.config.ts`
- `src/extensions/`
- frontend components under `src/components/` and `src/app/(frontend)/`

Use `src/admin/` only when the task is truly starter-core work that should change SmartSite for every install, not just for one site.

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

- the behavior should be reusable across SmartSite installs
- config or extension hooks are not enough
- the change belongs to shared CMS, routing, cache, admin UI, or plugin behavior

If the request is client-specific, treat `src/admin/` as off-limits and use config, extensions, or frontend code instead.

## Admin package manifest

`src/admin/package.json` is the admin-layer manifest.

When you do make a real admin-layer change:

- bump `version`
- update `releaseDate`
- add any new shared dependencies the admin layer requires

That manifest is how starter releases and downstream updates track shared admin changes.
