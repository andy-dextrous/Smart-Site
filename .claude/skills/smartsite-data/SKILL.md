---
name: smartsite-data
description: Extend SmartSite collections, relationships, access control or existing data through reviewed schema changes and resumable migrations.
---

# SmartSite data

Paths below are relative to this project root (the folder containing package.json).

Read `docs/engineering/configuration-system.md` and `docs/workflows/upgrading.md`. Normal content edits use MCP; this skill is for schema/access/backfill work. Inspect current adapter and target before planning a mutation. Missing database configuration must not silently select a different adapter.

Put collections in `src/payload/collections`, globals in `src/payload/globals` and plugins in `src/payload/plugins`; register them explicitly in `src/payload.config.ts`. A collection owns its own access, fields and hooks. Use the native configuration guide’s website-collection example when it needs public routing; `custom.smartsite.route` declares eligibility, it does not inject missing fields or hooks. Model relationships and access deliberately. Keep accounts, submissions, keys and internal state out of content tools. New content targets require explicit catalogue opt-in; schema presence alone does not authorize exposure. Test denied access as well as allowed access.

For existing records, make a compatible additive schema change, prepare an idempotent migration with a dry-run report and backup/recovery plan, test it on disposable data, then apply only within the user’s authorized environment. Thread req/transaction through related Payload operations, and use `overrideAccess: false` for user content operations. Privileged migration code is a separate operator action, never a content-tool escape hatch.

Regenerate types/import map and run relevant integration tests. Verify real CMS editing, relationship resolution and frontend rendering. Source rollback and database restoration are different operations; specify compatibility before launch.

Example: adding an optional services field should preserve existing records. Renaming a required field needs a tested backfill and compatibility period. A revoked MCP key needs repair, not broader database permissions.

For Payload API details, use the bundled Payload 3.92 `payload` skill, its relevant reference file, and this repository’s installed package types.

For 3.0.0/3.0.1 upgrades, use `docs/upgrades/4.0.0/README.md`. Inspect immutable old/new artifacts, prove backups by restore, then review the three-way candidate. Preserve custom package scripts, dependencies, workflows and source. A conflict in an old config or collection is work to reconcile, not permission to replace it. Record each deliberate resolution with its reason and test the resulting site independently.

For a 4.0.1 → 4.0.2 folder-layout update, follow the source-only procedure in `docs/workflows/upgrading.md` and `docs/upgrades/4.0.2/file-map.json`. Preserve customized files and component references; do not run the 3.x data migration or recreate local identity.
