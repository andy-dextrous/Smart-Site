# Upgrade and recovery

For this transition, read the [native MCP migration notes](../releases/native-mcp-transition.md).

An exported project is independent. Obtain a verified release archive through the owner's chosen release channel; never reach into a former factory checkout at runtime. Keep the old source revision, lockfile, environment, database backup and media backup. Prove restore on disposable storage before touching live data.

Compare the old baseline, customized project and new release in a three-way source merge. Review package and runtime requirements, `src/admin`, site config/extensions, section registries, environment changes, docs and both skill mirrors. Preserve custom components and edited core; surface conflicts instead of overwriting. Install the frozen lock, regenerate types/import map, and test with a separate restored database and storage.

For the MCP transition, preserve useful existing AI brand/context as reviewed facts in `docs/project/brief.md` and design.md before removing runtime config. Never copy conversations or credentials into public docs. Remove old AI routes/providers, shared agent keys, seed/control endpoints and the global CLI from active instructions. External hosted services and live key revocation are separate owner-authorized actions.

Existing Mongo databases must be authenticated replica sets before checked MCP writes work. Back up data and users, preserve credentials and enable replication using the controlled deployment procedure. Do not start a new empty volume and call it an upgrade. PostgreSQL requires an explicit tested migration with schema push disabled outside local environments.

Use `scripts/environment-adoption.ts` only with an explicit private request, intended environment and existing administrator, after reviewing stored identity. It creates missing internal identity on a verified legacy/hosted database; it does not seed content or change users. Configure an MCP key in the CMS and test catalogue/read before granting writes.

Deploy compatible code first, verify CMS/public behavior, then run any separately approved data migration. Source rollback restores the old code/lock. Content rollback restores selected fields from versions/current-revision checked saves. Whole database/media restore replaces state and needs explicit downtime/target approval; it is not a normal code rollback. Keep acceptance evidence and the recovery pointer with the project.
