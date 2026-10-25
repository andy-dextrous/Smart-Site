# Restore an isolated preview

This operation creates a separate site identity and local database. It is not an in-place upgrade and never adopts the live site. Keep the original backup unchanged; run the upgrade itself against the preview only after recording its deliberate preview-only changes as the baseline.

Prepare a fresh standalone checkout in its final directory and install its own dependencies. It must have no `.env` or previous private runtime. Review custom startup/read hooks and turn off provider writes and external integrations in the preview source. For a hosted media configuration, explicitly select local media in this preview only. Preserve production configuration in the original source and backup.

Use the helper from the verified 4.0 kit. Copy `scripts/upgrades/preview-*`, its `4.0.0/{common,mongo}.mjs` dependencies and the compatible local ownership helpers into a 3.x rehearsal checkout if needed; record these tooling-only additions before its upgrade baseline. Provisioning discovers either the old or native Payload config. Do not run bootstrap or seed on restored content.

```sh
node scripts/upgrades/preview-restore.mjs --source-site-id EXISTING_SITE_ID --prepare-database
```

The fresh connection is written as `DATABASE_URL` in the owner-private `.smartsite/local/restore-target.env`. Put only that absolute filename in the original backup request's `restoreEnvironmentFile`; never copy the credential into JSON or print the environment file in an agent transcript. It supplies the disposable restore-check connection for the original site's backup. After backup succeeds and releases that empty target:

```sh
node scripts/upgrades/preview-restore.mjs --source-site-id EXISTING_SITE_ID --backup-report /private/original-backup-reports
pnpm local:start
```

The helper verifies backup bytes and restored Mongo metadata/documents. It disables copied user authentication while retaining author IDs, clears copied MCP keys/operation receipts, removes live integration scripts, creates a new local operator/key and copies media to local storage. Credentials remain private; production connections and Blob tokens are not written into the preview environment. Review custom hooks, jobs and integrations before running the app; arbitrary client code can have effects outside these standard controls.

The private restoration receipt lists intentional differences. Compare content and media, then save the preview baseline and perform the ordinary in-place upgrade with its own identity. Never rewrite a recorded local project root or treat the original production keys as preview credentials.

An interrupted restoration fails closed. It does not clear a nonempty target or silently resume partial provisioning. Preserve the failed preview for diagnosis, stop only its owned processes and create a fresh preview for another attempt. The original source backup remains usable.
