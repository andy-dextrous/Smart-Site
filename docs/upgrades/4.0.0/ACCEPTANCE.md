# Existing-site acceptance

Record the exact old/new source and manifest hashes, environment identity, adapter and runtime versions, private backup location, test outputs and final source diff. Keep credentials and personal data out of public reports.

## Before source application

- The original release is verified, customized files are inventoried and Git is clean.
- Every old configuration key has an explicit destination. Inspect `settings-inventory.json` and `settings-map.json`; unknown keys stop inspection.
- All source conflicts are deliberately resolved, including custom access, hooks, blocks, collection/global slugs, workflow destinations, dependencies, locale behavior and storage prefixes.
- Source, private environment, documents, versions, indexes, collection options and every media original/variant are backed up. A distinct restore has been compared.
- Automatic media backup supports the `media` collection, standard local `public/media`, and accessible HTTPS objects with a verified host, size and content type. Additional upload collections, custom local directories, private/proxied assets and encrypted/special Mongo collections require a separately verified backup procedure. They must never receive an automatic success claim.
- The original app and workers are stopped for cutover. A consistent live backup alone is not permission to apply source or migrate data.

## Preserved data and recovery

Run inspect, backup, reconcile, dry-run migration, apply and verify from the verified kit. Repeated migration must use the same receipt and make no additional changes. Original site ID, users, API keys, document IDs, public content, private drafts, version history, timestamps, relationships and media remain intact. Legacy jobs retain input/history and a durable reference to replacement work. Other custom/native jobs retain every BSON byte. Include both future and overdue native scheduled jobs; missing decisions and malformed targets/users must stop. Prove a preserve-paused upgrade does not publish overdue content, and separately test deliberately enabled native scheduling only with verified opt-in infrastructure.

Test private restore-file mode/path checks, rejected inline credentials and changed restore-file bytes invalidating prior proof. Use a fresh Codex/Claude upgrade session to verify environment files are consumed privately without leaking values into transcripts. Test unresolved source conflicts, a tampered backup, concurrent source edits and interrupted apply in separate disposable rehearsals. Each must preserve evidence and refuse unsafe continuation. Recover an interrupted worker and confirm every affected route; confirm a failed cache delivery is visible and retryable. Do not equate a committed document with completed publication.

## Application acceptance

Install with the site's own frozen lockfile. Generate types/import map with its verified environment; type-check, lint and unit checks must pass. Build and run the production application independently of the originating workspace. Check public/draft pages, parent renames, homepage changes, archive changes, redirects, metadata, sitemaps, search, forms and all media variants. Confirm unchanged custom sections and collection behavior.

Inspect desktop and mobile in the actual external browser. Log into the CMS; edit and preview content; verify the existing Settings/API Keys experience. Inspect publication pending/error/recovery through authenticated diagnostics; do not add CMS controls. Verify the correct site through real MCP catalogue/read/save/status calls, permissions, stale revisions and replay. In each independent upgrade session, create a disposable new draft, read its revision, perform a checked update and verify its committed operation status and readback; connectivity or native reads alone are insufficient. Keep original content/authentication unchanged. With default background recovery off, prove migration work remains pending and an authenticated explicit recovery request completes it; no hidden poller may supply this acceptance. Independent Codex and Claude sessions must discover the shipped instructions and complete real tasks, with results checked separately from their summaries.

For self-hosted sites, exercise the actual application image, persistent media, authenticated Mongo replica set, worker restart, promotion and rollback. Database-only Docker tests do not establish application acceptance. For Vercel, verify immediate native-save publication/cache delivery and the explicit authorized recovery endpoint. Automatic cron is optional: verify it only for a site that deliberately opts into scheduled publication and supplies the required infrastructure.

## Cutover and rollback

Repeat the rehearsed procedure on the actual target under its owner's authorization. Record the last accepted pre-cutover write and final serving revision. Never run old and new mutation workers together. Test the prior application against the compatible preserved schema before declaring rollback ready. After incompatible edits or new production content, reconcile those writes before any snapshot restore. Keep acceptance open when an environment, credential or provider prerequisite prevents a required check.
