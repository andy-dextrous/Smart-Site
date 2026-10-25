# Upgrade and recovery

An existing site owns all its source and data. Upgrade with a reviewed three-way comparison of the original release, the customized site and the new release. Preserve custom code, dependencies, scripts, workflows, environment identity and content.

For **3.0.0 or 3.0.1 → 4.0.2**, follow the [versioned upgrade kit](../upgrades/4.0.0/README.md). It includes inspection, source reconciliation, backup/restore verification, idempotent legacy-job conversion and preservation checks. Run it in a restored rehearsal first, then in the original site directory during the authorized cutover. Do not bootstrap, seed, adopt a new identity or move local runtime state to another folder as an upgrade shortcut.

Older sites first need a separately verified 3.x transition. Unknown baselines and unresolved customizations stop with a report. PostgreSQL needs its own reviewed migration; automatic 4.0 data migration supports Mongo replica sets.

Source rollback restores the prior code/lockfile against compatible data. Whole-database restoration is different: freeze writes, preserve edits made after cutover, and restore coordinated source/database/media snapshots only within the owner's authorized recovery scope. Never silently discard post-cutover edits.

The earlier [native MCP transition notes](../releases/native-mcp-transition.md) remain relevant to sites that still contain the retired chat/AI runtime. They are not the 4.0 procedure.

## 4.0.1 → 4.0.2: source organization only

This release moves source files without changing the content schema, collection slugs, fields, URLs, settings, credentials or dependencies. Use the exact [source move map](../upgrades/4.0.2/file-map.json). The same layout mapping applies to a privately retained 4.0.0 source tree; 4.0.0 was not published as a public starter release.

1. Save the existing source and lockfile in Git. Download the official old and new release archives, verify their published checksums and manifests, and compare them with the customized site. Rehearse in a disposable standalone copy with an isolated database before updating the original site.
2. Move customized files to the map’s destinations. Merge the old baseline, customized file and new release at each destination; preserve client additions and resolve collisions explicitly. The map is an inventory, not a command to overwrite a customized directory. Remove the two listed placeholder text files only if they still contain the original placeholder text. The unused `staging-sync.config.json` is also retired; preserve any site-specific external automation that still reads a customized copy before removing it.
3. Update imports, stylesheet paths, scripts and Payload component-path strings, including strings with `#ExportName`. Shared React hooks stay in `src/hooks`; Payload lifecycle hooks move into `src/payload/hooks`. Use `lib/routing/fields` for settings-field factories and `lib/routing` for the URI engine. Keep `payload.config.ts` at its existing location.
4. Merge the new docs, skills, tests and release metadata too. Release metadata now lives in `config/smartsite-release.json`; the optional deployment example lives in `docker/smartsite-deployment.example.json`. The site-specific `smartsite-deployment.json` stays at its existing path. Retain custom dependencies/scripts and the existing environment/runtime state. Install the frozen lockfile, generate types and the import map in the intended isolated environment, and run type-check, lint, units, build and browser acceptance. Verify schema equivalence and existing CMS content, uploads, draft/publish, MCP, URI routing, cache invalidation and the admin bar.
5. Deploy the reviewed source through the site's existing process. No data migration, legacy-job conversion, bootstrap, seeding, account/key rotation or identity change is needed. Do not run the 3.x migration kit for a 4.x layout update; its supported source versions remain 3.0.0 and 3.0.1. If acceptance fails, restore the previous source/lockfile; do not restore or reset the database for a folder move.

Keep a short record of the exact old/new revisions, customized resolutions and standalone checks. Existing sites can retain their old layout until their owner chooses this source update.
