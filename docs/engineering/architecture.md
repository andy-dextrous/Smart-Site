# Architecture

SmartSite is a complete Payload and Next.js application. The project owns its code, database, media, dependencies and agent skills. It needs no connection to the repository where it originated.

`src/payload.config.ts` is the server assembly point. Collection definitions in `src/payload/collections` own their fields, access and hooks. Globals, fields and plugins have corresponding folders. Database, email and storage integration live in `src/payload`. Use normal Payload configuration to change them.

`src/app/(frontend)` serves the public website. `src/lib` contains URI routing, published-data caching, rendering, search, sitemaps and durable publication work. `src/components` contains sections and frontend components. `src/site.config.ts` holds serializable presentation choices that may be imported by the browser; it contains no credentials or collection registry.

`src/components/cms` contains CMS layout, widgets and styling. It is ordinary editable application source. `src/app/(payload)` provides Payload’s routes and generated import map. Generated content types live in `src/payload-types.ts`.

`src/payload/mcp` registers checked content tools through Payload’s native MCP transport at `/api/mcp`. Payload controls access and validation; SmartSite adds current revisions, operation receipts, response projection and bounded media handling. A content transaction also records required publication work. The serving runtime completes that work and acknowledges cache invalidation separately from the content commit.

Website metadata is explicit: `custom.smartsite.route`, `seo`, `search`, `sitemap` and `mcp` describe capabilities. They do not install fields, hooks or permissions. Schema factories use an inventory derived from the single collection registration list. Runtime consumers use the built Payload config. A final assertion rejects plugins that silently change website registration after those schema factories run.

MongoDB needs a replica set for transactional content and publication work. Local setup creates an authenticated, loopback-only replica set with private per-project state. Production uses an explicitly selected database and durable media provider. PostgreSQL remains an advanced native adapter choice with separately tested migrations; the automatic 4.0 upgrade kit supports Mongo only.

See [configuration](configuration-system.md), [publication and caching](routing-and-caching.md), [MCP](mcp.md) and [upgrades](../workflows/upgrading.md).

## Source layout

The six top-level source folders have distinct responsibilities:

| Folder | Responsibility |
| --- | --- |
| `app` | Next.js routes, layouts and Payload integration |
| `components` | Website sections, blocks, field components, providers and CMS presentation |
| `hooks` | React hooks shared by components |
| `lib` | Routing, caching, data access, rendering, publication, search, sitemaps and helpers |
| `payload` | Native collections, globals, access, schema fields, lifecycle hooks, plugins, MCP and adapters |
| `types` | Shared TypeScript declarations |

`payload.config.ts`, `payload-types.ts` and `site.config.ts` stay at the source root. Section schemas stay beside their components. Shared schema-only field factories live in `payload/fields`; reusable field UI lives in `components/fields`. CMS presentation lives in `components/cms`, with its own `ui`, `styles` and `providers`. The native admin options are in `payload/admin.ts`. Import specific modules directly; this layout does not add an extension registry or wrapper API.
