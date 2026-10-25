# SmartSite 4.0 upgrade kit

This architecture upgrade kit upgrades **3.0.0 or 3.0.1 to release 4.0.1**. Its `4.0.0` directory and database migration marker identify the unchanged native Payload transition, not the release package version. Keep those identifiers unchanged. The unpublished 4.0.0 tag is retained for provenance and is not a supported source baseline.

Start with [UPGRADE.md](UPGRADE.md). It covers supported baselines, backups, source reconciliation, data migration and rollback.

- [Change map](CHANGE-MAP.md) and [complete setting map](settings-map.json)
- [Acceptance requirements](ACCEPTANCE.md)
- [Isolated preview restoration](PREVIEW.md)

A successful preservation check is one part of acceptance. Build, browser, MCP and recovery checks must also pass.
