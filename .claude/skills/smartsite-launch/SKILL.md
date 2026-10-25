---
name: smartsite-launch
description: Prepare or perform an authorized SmartSite launch, first content transfer, deployment, backup or release upgrade.
---

# SmartSite launch

Paths below are relative to this project root (the folder containing package.json).

Read `docs/workflows/first-launch.md`, then the relevant hosted/self-hosted sections of `docs/workflows/deployment.md`. For existing sites also read `docs/workflows/upgrading.md`. Local startup does not require choosing a hosting provider. Prepare a reviewable preview and concrete deployment/content report before requesting a genuinely missing domain, account, cost or publication decision.

The exported repository owns all source, dependencies, workflows and skills. Use the site owner’s accounts. Code builds are not content backups. Initial launch must deliberately transfer approved content and reachable media, remap relationships and preserve publication intent. Excluded accounts need explicit mappings or an approved optional omission; never guess by name/email or copy source account IDs. Resolve required references before effects.

Later code deployments preserve live edits: do not rerun initial content transfer or seed. Schema migrations need tested compatibility and recovery. Self-hosted Mongo must support authenticated transactions. Existing volumes require a backup and controlled conversion; do not change their replication mode blindly.

An upgrade is a reviewed source merge from a verified release, including skills/docs/config/dependencies. Preserve customized sections, config and edited core or report conflicts. Preserve useful old AI brand context as reviewed project facts before retiring its runtime. Do not shut down external services or revoke shared production keys merely because source was removed.

Deploy without scheduled services by default. Normal saves drain committed publication work and administrators can recover pending work without `CRON_SECRET`. Only opt into native future publishing or a background runner when wanted. Follow the deployment guide: select native collection/global targets, review existing unfinished jobs, configure the explicit runner and verify its cadence/authentication. The persistent poller requires `SMARTSITE_BACKGROUND_RECOVERY=true`; Vercel ships no cron. Keep the existing hosting account/project unless the user asks to move it; never purchase a plan to satisfy an optional feature.

Finish with destination checks, actual browser inspection, durable asset verification and a rollback record. A successful build alone is not a launch. Keep untested platforms and unavailable prerequisites explicit.

The 4.0 upgrade guide is `docs/upgrades/4.0.0/README.md`. Upgrade a populated site in place; do not bootstrap, seed, transfer its database or regenerate its identity. Test the new source against a restored copy before cutover. Source conflicts must remain preserved and actionable. Confirm durable publication work exists for converted legacy jobs and completes in the actual serving runtime before declaring cutover finished.

For a 4.0.1 → 4.0.2 folder-layout update, follow the source-only procedure in `docs/workflows/upgrading.md` and `docs/upgrades/4.0.2/file-map.json`. Preserve customized files and component references; do not run the 3.x data migration or recreate local identity.

Self-hosting is opt-in. A fresh starter and normal local/hosted setup must have no `.smartsite-self-hosted/` directory or generated `smartsite-deployment.json`. Only after the owner chooses self-hosting, follow the deployment guide: initialize the manifest, configure the destination, then prepare its private environment. The helpers create the directory when needed. Preserve existing self-hosted state when upgrading; never delete it as cleanup.
