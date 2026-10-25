# SmartSite 4.0 change map

The top-level `package.json` owns the product version. `smartsite-release.json` records supported upgrades; `smartsite-export.json` records artifact hashes. See [file-map.json](file-map.json) for exact moves. A null destination means the framework module was removed and any customization requires reconciliation.

| Former owner | 4.0 owner / action |
| --- | --- |
| `src/admin/payload/payload.config.ts` and config resolver | Explicit `src/payload.config.ts` |
| Config defaults, validator, deep merge and freeze | Removed; native typed definitions own defaults/options |
| `src/smartsite.config.ts` collection overrides | Edit `src/collections/<slug>.ts` directly |
| `src/extensions` registries | Ordinary collections/globals/blocks/plugins explicitly registered in Payload config |
| Admin metadata/live preview | `src/admin/config.ts` and collection preview options |
| Admin theme values | Native CSS in `src/admin/css`; no config-time CSS file writes |
| Identity, motion, breadcrumbs, public search/locale and image-display choices | `src/site.config.ts` |
| Collection enable/frontend/SEO/search/sitemap flags | Explicit registration, native fields/hooks and `custom.smartsite` metadata |
| Media provider/size/quality/focal options | Native upload configuration and storage plugins; retain all provider options |
| Database/localization/email/plugin options | Native Payload config and `src/payload` modules |
| MCP switch and target lists | `smartsiteMcp({ enabled })` plus definition-level `custom.smartsite.mcp` |
| `src/admin/cache`, routing, redirects and public data helpers | `src/website` domains |
| `src/admin/mcp` | `src/mcp` |
| Payload collections/globals/fields/hooks/access/plugins/types | Corresponding top-level `src` folders |
| Shared frontend rendering/UI | `src/components/cms`, `src/components/cms-ui`, `src/components/content-fields`, `src/website/rendering` |
| `src/admin/package.json` | Removed; preserve custom dependency changes in the top-level package |
| Old module aliases and generated files | Updated imports, `@payload-config`, `src/payload-types.ts` and regenerated admin import map |
| Exported workflows | Standalone project commands; preserve client targets and secret references |

No user-content field path, collection slug, block slug, draft/version setting, document ID, relationship, user, key or site identity is renamed merely to reorganize code. Internal `site-publication-work` and `site-upgrade-receipts` are additive. Native internal collections remain outside content MCP.

Publication intent now commits with content. Bounded workers recover abandoned claims and expose pending/failed/completed state. Cache acknowledgement occurs inside the actual Next serving runtime; standalone scripts cannot pretend that an absent cache context succeeded. Local/single-instance self-hosting uses the serving process poller; Vercel uses authenticated cron. Multiple self-hosted serving instances require an explicitly shared cache/invalidation design.

Derived routing changes preserve content drafts/versions/timestamps. Canonical URIs are recomputed from current settings on each source save, avoiding stale derived values from old versions. Homepage selection uses document identity. Returning to a former URI removes only conflicting automatic redirects; manual redirects keep precedence. A homepage never creates an automatic redirect from `/`.

Cycles and excessive page nesting are rejected. Reparent children and change archive assignments before deleting/trashing a referenced page. Trashing the homepage clears its assignment. These are deliberate safety changes; do not recreate the old silent route fallback when resolving an upgrade conflict.

Before acceptance, translate every customized old setting, test explicit relationship restrictions and custom Lexical blocks, confirm disabled-MCP behavior, and run the application entirely outside any originating workspace.

The exhaustive old-setting routes are in [settings-map.json](settings-map.json). Inspection reports each authored key without printing values. Provider option bags remain intact but require source review; this map is not permission to discard an unfamiliar option. Image size entries retain `name`, `width`, optional `height` and `crop`; locale URL settings do not automatically enable native translated fields.

## Optional scheduled publication

SmartSite 4 leaves native `versions.drafts.schedulePublish` and automatic background recovery off by default; normal saved content still publishes immediately. Existing unfinished native scheduled jobs are inventoried without executing them. The upgrade request must explicitly keep affected targets paused or enable them with verified infrastructure and an overdue-job review. Every original native job remains byte-for-byte intact. This deliberate scheduling default is separate from preserving draft content, version history and access rules. See [UPGRADE](UPGRADE.md) for the exact request decision and activation gate.
