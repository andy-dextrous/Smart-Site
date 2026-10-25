# Upgrade and recovery

An existing site owns all its source and data. Upgrade with a reviewed three-way comparison of the original release, the customized site and the new release. Preserve custom code, dependencies, scripts, workflows, environment identity and content.

For **3.0.0 or 3.0.1 → 4.0.1**, follow the [versioned upgrade kit](../upgrades/4.0.0/README.md). It includes inspection, source reconciliation, backup/restore verification, idempotent legacy-job conversion and preservation checks. Run it in a restored rehearsal first, then in the original site directory during the authorized cutover. Do not bootstrap, seed, adopt a new identity or move local runtime state to another folder as an upgrade shortcut.

Older sites first need a separately verified 3.x transition. Unknown baselines and unresolved customizations stop with a report. PostgreSQL needs its own reviewed migration; automatic 4.0 data migration supports Mongo replica sets.

Source rollback restores the prior code/lockfile against compatible data. Whole-database restoration is different: freeze writes, preserve edits made after cutover, and restore coordinated source/database/media snapshots only within the owner's authorized recovery scope. Never silently discard post-cutover edits.

The earlier [native MCP transition notes](../releases/native-mcp-transition.md) remain relevant to sites that still contain the retired chat/AI runtime. They are not the 4.0 procedure.
