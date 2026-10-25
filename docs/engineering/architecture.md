# Architecture

The project root contains the entire product. `src/app/(frontend)` serves public pages; `src/app/(payload)` hosts Payload administration and its REST routes. `src/admin/payload/payload.config.ts` assembles collections, globals, storage, email and plugins. `src/admin/mcp` registers checked content tools through `@payloadcms/plugin-mcp` at `/api/mcp`.

`src/smartsite.config.ts` configures the site. Add collections and deliberate overrides in `src/extensions`, and section schemas/renderers in `src/components/sections`. Keep business customization out of shared `src/admin` where the extension/configuration surfaces suffice. This is a maintenance boundary inside this repository, not a dependency on an external monorepo.

The coding agent owns design and interpretation. Payload owns access, validation and content persistence. SmartSite adds revisions, operation receipts, response projection and bounded media handling. Local helpers own deterministic setup and process cleanup. Skills teach when to use those surfaces; there is no separate conversational application or semantic routing service.

MongoDB needs a replica set for atomic content/receipt transactions. The standard local path uses an authenticated, loopback-only single-node replica set with private project data. Production uses an explicitly selected environment and independently provisioned credentials/storage. PostgreSQL is an advanced configuration needing its own tested migrations; it is not the default local path.

See [MCP](mcp.md), [configuration](configuration-system.md), [development](../workflows/development.md) and [first launch](../workflows/first-launch.md).
