# Upgrade an existing SmartSite to 4.0.2

This kit upgrades **3.0.0 and 3.0.1** sites in place. It preserves existing source customizations or reports a conflict, and checks database/media preservation independently of the code build. The automatic data procedure supports MongoDB replica sets. PostgreSQL and unknown baselines stop for a separately reviewed migration.

Read [CHANGE-MAP](CHANGE-MAP.md) and [acceptance requirements](ACCEPTANCE.md) before editing. SmartSite 4.0 replaces the old configuration framework with native Payload composition; copying a new `src/admin` folder over an existing site is not an upgrade.

## 1. Prepare a real rehearsal

Keep immutable copies of the exact old release and the new verified release, outside the site. Verify archive checksums through the release channel and record the SHA-256 of each `smartsite-export.json`. A checksum supplied by an untrusted archive alone does not establish its provenance.

Back up the original source/environment/database/media. Restore a production copy only into deliberately isolated database and storage targets with outgoing integrations disabled. Do not reuse production client keys in a preview. Any preview-only identity/operator changes happen during explicit clone preparation, before the upgrade baseline is inspected. The original production identity and data stay unchanged.

Create a local Git upgrade branch and save existing source changes. Do not relocate a local site's `.smartsite` state or change its recorded project root. Existing local fixtures are upgraded in the same directory in which they were initialized.

Stop the old application and mutation workers. Keep its database available for the upgrade. Record the last accepted content write. Never run 3.x and 4.0 mutation workers against the same database simultaneously. Preserve existing secrets, users, keys and database credentials. A normal upgrade does not require `CRON_SECRET` or an automatic scheduler. Existing unfinished native scheduled publications require the explicit decision below; they must not run merely because the code starts after upgrade.

For a 3.x Docker deployment, complete [checked legacy-media relocation](../../workflows/docker-media.md) now, before creating the request. Preserve the old build volume and copy every original/variant into durable storage and the host-side backup directory. Native 4.0 uses an explicit persistent upload path.

## 2. Create the private request

Keep this file outside Git with private permissions. Use absolute paths. The report directory must be separate from the site and both immutable artifacts. The restore-check database must be a distinct, empty disposable database with an authenticated replica-set connection. The helper deletes only its owned restore-check database after comparing it; it never restores over the source database.

```json
{
  "schemaVersion": 1,
  "siteRoot": "/private/work/my-site",
  "expectedSiteId": "existing-site-id-from-the-verified-environment",
  "sourceVersion": "3.0.1",
  "targetVersion": "4.0.2",
  "oldBaselineDirectory": "/private/releases/smartsite-3.0.1",
  "targetArtifactDirectory": "/private/releases/smartsite-4.0.2",
  "verifiedManifestPath": "/private/releases/smartsite-4.0.2/smartsite-export.json",
  "baselineManifestSha256": "verified-old-manifest-sha256",
  "targetManifestSha256": "verified-new-manifest-sha256",
  "environmentFile": "/private/work/my-site/.env",
  "reportDirectory": "/private/upgrade-reports/my-site-4.0.2",
  "restoreEnvironmentFile": "/private/upgrade-credentials/restore.env",
  "scheduledPublishing": {
    "decision": "preserve-paused",
    "reason": "Keep existing future and overdue publications paused until the owner deliberately enables scheduling."
  },
  "writesQuiesced": true,
  "allowedMediaHosts": ["your-verified-public-media-host.example"]
}
```

The source environment must explicitly select `DATABASE_PROVIDER=mongoose`, `DATABASE_URL`, `PAYLOAD_SECRET` and its existing `SMARTSITE_SITE_ID`. An implicit staging selector is refused. `allowedMediaHosts` lists exact verified HTTPS hosts for existing hosted originals/variants. Local media needs no host entry. Private-provider assets require an explicit authenticated backup procedure; do not treat an unavailable download as success.

Put only `DATABASE_URL` for the disposable restore database in the separate `restoreEnvironmentFile`, with owner-only permissions (mode0600). Never put a connection string in the request. The kit rejects the former inline `restoreDatabaseURL` property; move that value privately into the environment file and create a new inspection/report lane. Do not print or `cat` either environment file, credentials, client secrets or backup files into an agent transcript. The documented request schema contains paths and decisions, not credentials; still inspect unknown user-authored files cautiously rather than assuming their contents are safe. The optional preview helper prepares `.smartsite/local/restore-target.env` for this purpose.

The request, source environment, canonical restore-environment path and exact restore-file bytes are fingerprinted. Changing either requires a fresh inspection/reconciliation report; do not edit reports to bypass an identity mismatch.

## 3. Inspect, back up and restore-check

Use the scripts from the immutable new artifact. Node orchestrates the procedure; the existing site's Mongo driver supplies database access. No global SmartSite CLI is required.

```sh
node "$SMARTSITE_KIT/scripts/upgrades/4.0.0/inspect.mjs" --request "$SMARTSITE_UPGRADE_REQUEST"
node "$SMARTSITE_KIT/scripts/upgrades/4.0.0/backup.mjs" --request "$SMARTSITE_UPGRADE_REQUEST"
node "$SMARTSITE_KIT/scripts/upgrades/4.0.0/reconcile.mjs" --request "$SMARTSITE_UPGRADE_REQUEST"
```

Inspection verifies release file hashes, clean Git source and the stored database identity. It reads unfinished native `schedulePublish` jobs directly without initializing Payload or running jobs, and writes a private `scheduled-publishing-inventory.json` with job IDs, actions, target collection/global, scheduled times, locale codes and shape issues; it never copies arbitrary job input or auth values into that report. Missing action retains Payload's implicit publish meaning. Malformed/ambiguous targets, invalid times and unsupported legacy user references stop for deliberate repair.

If unfinished native jobs exist, choose one documented `scheduledPublishing` decision in the original request:

- `preserve-paused`: preserve every job byte, including overdue work. Keep `versions.drafts.schedulePublish: false` on each affected collection/global. Do not start custom `jobs.autoRun` or other unfiltered workers. Review jobs later before enabling this native feature.
- `enable-with-infrastructure`: explicitly enable native `versions.drafts.schedulePublish` on every affected target, retain/set a private `CRON_SECRET`, and include `infrastructure: { "kind": "external-caller", "evidence": "non-secret scheduler verification record" }`, `overdueJobsReviewed: true` and `activateAfterVerification: true`. A persistent process may instead use kind `persistent-process` with `SMARTSITE_BACKGROUND_RECOVERY=true`. The evidence describes a real checked caller/process; a declaration alone is not runtime acceptance. Keep app/scheduler stopped through migration and verification, then deliberately activate it, knowing overdue jobs may run immediately. No hosted cron is installed automatically.

With no unfinished native jobs the decision is optional. Native targets and the decision must agree before data migration. Enabling a localized job also requires its locale to remain configured and its action to be explicitly `publish`; otherwise the native handler could fall back to a wider publication. Unknown locales and localized unpublish/implicit-action jobs require deliberate review before activation; paused jobs keep their original bytes. The kit never executes, deletes, reschedules or marks these jobs complete; standard preservation checks compare their bytes. Review all custom startup hooks/workers separately before bringing the site online. Backup copies source, private environment and local media; it exports Mongo documents, indexes and collection options, restores into the empty check database, and compares them. Unsupported collection types require a separate backup procedure. Hosted media is downloaded from the allowed hosts and its bytes are read back and hashed. The source database is compared again to detect writes during backup.

If backup was interrupted, retain its reports and use the same command with `--resume`. Only a restore database carrying that attempt's matching private ownership token may be cleared. An unrelated nonempty database is refused. Do not delete evidence or change the target to make a check pass.

## 4. Review and reconcile source

`reconcile.mjs` prepares a private candidate directory and reports conflicts; it does not immediately overwrite the site. Review the full source diff and the [setting map](CHANGE-MAP.md). Exact baseline files take the new release; customized files use a three-way merge. New client files are preserved. Customized removed modules, binary collisions and client deletions require explicit resolution.

Move old site configuration into its native owners. Preserve custom fields, collection/global slugs, block slugs, locale settings, storage options, access rules, hooks, dependencies, scripts and workflow destinations. Keep both skill mirrors. Register website collections before the inventory is constructed; plugins may not silently add routed collections afterwards.

For conflicts, edit the candidate and provide a private resolutions JSON keyed by the original filename:

```json
{
  "src/smartsite.config.ts": {
    "action": "remove",
    "reason": "All site options translated into payload.config.ts, collection definitions and site.config.ts; reviewed in the candidate diff."
  },
  "src/admin/payload/collections/posts.ts": {
    "action": "merge",
    "reason": "Custom editorial fields and access retained alongside the native 4.0 hooks."
  }
}
```

`merge` uses the reviewed candidate file; `keep` takes the original from the verified backup; `replace` takes the new release file; `remove` removes that candidate path. Choose actions based on actual behavior, not merely a desire to clear the report. The tool cannot decide whether a custom feature is expendable.

```sh
node "$SMARTSITE_KIT/scripts/upgrades/4.0.0/reconcile.mjs" --request "$SMARTSITE_UPGRADE_REQUEST" --apply --resolutions /private/resolutions.json
```

Omit `--resolutions` when there are no conflicts. Application uses an atomic per-file journal and refuses concurrent source changes. Retry the same request/candidate after an interruption. Do not edit the candidate after application starts; reconcile a deliberate repair separately. Incomplete candidate-preparation attempts are retained; rerunning preparation creates a new private candidate.

If package manifests changed, reconcile dependencies/scripts and generate a matching lockfile in this site. Then verify a frozen install. Regenerate generated files against this site's own prepared environment; do not run bootstrap or seed on the populated site.

```sh
pnpm install --frozen-lockfile
pnpm generate:types
pnpm generate:importmap
pnpm type-check
pnpm lint
pnpm test:unit
```

## 5. Migrate and verify preservation

```sh
node "$SMARTSITE_KIT/scripts/upgrades/4.0.0/migrate.mjs" --request "$SMARTSITE_UPGRADE_REQUEST"
node "$SMARTSITE_KIT/scripts/upgrades/4.0.0/migrate.mjs" --request "$SMARTSITE_UPGRADE_REQUEST" --apply
node "$SMARTSITE_KIT/scripts/upgrades/4.0.0/verify.mjs" --request "$SMARTSITE_UPGRADE_REQUEST"
```

The dry run binds the reconciled source hash. Apply rechecks the backup and existing data. It adds an upgrade receipt and converts unfinished legacy `dependent-uri-updates` jobs into durable current-state publication work in bounded transactions. Original job inputs/history remain; converted jobs reference their recovery work through the receipt. Other tasks are not discarded. Content documents, drafts, versions, users, keys and identity are not rewritten as part of moving source.

A repeated apply uses the same receipt. An interrupted batch resumes from persisted job state. Do not change the request fingerprint after migration begins. Repair a source defect deliberately, rerun dry-run to bind that repaired source, and retain the original request/database identity.

Verification compares existing document identities and bytes, collection metadata, index ordering, local media and hosted media checksums. It permits only the named additive internal collections and recorded legacy-job conversion fields. It verifies the converted work still exists. `data-preserved` is a preservation result; it is not a claim that the app, browser or MCP client has passed acceptance.

## 6. Run the upgraded site independently

Build/start from the upgraded standalone directory. Keep its own environment, database, ports and credentials. For a local owned runtime, use `pnpm local:start`; stopping must preserve its data. Production acceptance uses `pnpm build` and the appropriate serving runtime, not development mode alone.

Check public homepage/nested pages/articles/archives, draft preview, redirects, metadata, sitemap, navigation, forms and media originals/variants. Check CMS login/editing, Settings and API Keys. Connect independent Codex and Claude sessions through normal project trust and verify catalogue identity, read/save, draft separation and receipts. Test custom sections/collections and denied access. Verify pending legacy work completes through the authenticated serving runner; missing/failed work keeps cutover acceptance open.

Run destructive clean-start fixtures in a separate fresh export; they must not be pointed at this populated site. Retain source/manifest identities, test outputs and browser evidence privately. After a successful rehearsal, repeat the same reviewed procedure on the actual site under the authorized cutover scope.

## Recovery and rollback

Docker rollback also requires the [post-build media copy for old code](../../workflows/docker-media.md#compatible-rollback-to-a-3x-source-image). Rebuilding an old standalone image alone does not make uploads in the durable volume visible to that old runtime.

Before incompatible content/schema changes, 3.x code can read the preserved content plus unused additive internal collections. Stop the 4.0 server/runner first, restore the prior source/lock/environment, and verify old-code reads/writes. Pending publication work and converted legacy jobs need an explicit recovery decision; do not silently delete them.

After site-specific incompatible changes or new production writes, rollback requires a coordinated source/database/media plan. Preserve and reconcile post-cutover edits before restoring a snapshot. A whole-database restore is not a generic retry step. The kit retains the original source and data backup; it does not automatically overwrite a live database to conceal a failed upgrade.
