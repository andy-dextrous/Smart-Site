# SmartSite 3.0.0 — native MCP transition

This is the migration guide for SmartSite 3.0.0, the standalone development kit replacing the 2.3.13 starter workflow. Read the upgrade instructions before applying this major release to an existing site.

The project now owns its lockfile, runtime scripts, documentation and Codex/Claude skills. Payload 3.92.0 provides MCP transport and authentication. SmartSite supplies four bounded editing tools for schema/content reads, checked saves, image uploads and uncertain-operation recovery. Next is pinned to 16.3.3, Node to the supported 24.22.1+ patch line, and pnpm to 10.34.8.

The global SmartSite CLI, hosted chat application, embedded chat/control routes and HTTP seeding endpoint are retired in this source. No model API key is needed by the site. Use a coding agent to edit source and its project MCP connection to edit content. Existing CMS editing remains available without an agent.

For new sites, open the folder and ask the agent to set it up. Bootstrap creates essentials only; the agent builds the requested pages from the brief. Setup uses a private project database, identity, keys and ports. Each clone is independent. The client may require its normal trust/reconnect action; setup cannot truthfully bypass that action or verify a client merely by writing configuration.

For existing sites, follow [upgrade and recovery](../workflows/upgrading.md). Preserve the site's custom source, content, users, media and credentials. Merge the supplied source release against the site's original baseline; inspect conflicts. Restore backups into separate disposable storage and rehearse before touching live data. Use the explicit identity-adoption helper for a verified existing database. Configure new per-operator MCP grants through the CMS, then verify reads before writes. Legacy AI account records are not deleted automatically; they receive no new MCP privileges.

Mongo must support authenticated transactions. The self-hosted Compose topology now initializes a replica set and retains its key separately from data. Existing standalone volumes require the documented backup/conversion/rollback procedure. PostgreSQL remains an advanced path requiring its own tested migrations; this release's default acceptance is Mongo. Native macOS ARM64 and Linux Docker are exercised; native Windows lifecycle is not supported yet.

See [standalone verification](../../tests/README.md) for reproducible checks. The official Payload dependency graph currently produces an upstream peer warning: mcp-handler 1.1.0 requests MCP SDK 1.26.0 while Payload's MCP package pins 1.30.0. The checked HTTP/client flows are tested with the official graph; do not downgrade that SDK independently to silence a warning.

No published npm package, external site, live hosted chat deployment or real credential is removed by this source migration. Inventory any remaining external consumers before separately authorizing their shutdown. Later code deployments must preserve live content and must not repeat first-launch content transfer.
