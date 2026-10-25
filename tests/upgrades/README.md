# Standalone upgrade regression suite

Run `pnpm test:upgrade` from the project root with Node 24.22.1 and Corepack's pinned pnpm. With no arguments, the suite creates a private temporary directory, snapshots current source without secrets/runtime state, downloads public 3.0.0 and 3.0.1 archives by immutable commit, verifies their pinned SHA256 checksums and file manifests, then runs all three cases. No GitHub authentication or factory code is required. Network access is needed for archives and uncached packages.

For previously verified artifacts, pass explicit directories. The fixture directory must be outside those artifacts. Each case copies only immutable source, installs its own dependencies, creates its own database/credentials in its final directory, and upgrades in place.

```sh
node tests/upgrades/run.mjs --artifact /absolute/4.0-export --baselines /absolute/baseline-parent --lane /absolute/private-test-lane --case clean-3.0.0
```

The baseline parent contains `immutable-3.0.0` and `immutable-3.0.1`, including verified `smartsite-export.json` manifests. Repeat with `clean-3.0.1` and `custom-3.0.1`, or omit `--case` to run all three. Use `--offline` only when the pnpm store already contains the required packages; archive downloads still require the network unless `--baselines` is supplied. Different cases can share a lane, but never relocate initialized cases. Reports, databases and logs remain private. Normal completion and failures stop the owned app/database and preserve their data. Step markers allow continuation after repair; do not edit an artifact or request to force an interrupted case to pass. A new artifact needs a fresh lane.

Coverage: published parent/child and private draft populated through HTTP MCP; original API key and site identity; local image; nested content arrays; Date/regex collection validators and a Date-filtered compound index with preserved key order; native queued jobs plus sparse historical job and unrelated job; full backup restore/checksum comparison; unknown authored-setting refusal; source-apply refusal without write quiescence and unchanged source hashes; explicit source-conflict refusal; backup corruption refusal; SIGKILL during source apply and exact-request resume; migration replay; installed Local API and real HTTP editing; source rollback and reads/writes with the previous release. Customized case adds a page field/value, a source module and 32 pending legacy jobs. Throwing startup and automatic-job callbacks prove migration does not launch those application side effects.

Each case binds its artifact, baseline and harness hashes to its private step markers. Reusing a case with changed inputs fails; start a fresh lane instead of reusing previous passing markers.

HTTP uses the real owned Next development server. Production build/cache/browser acceptance, hosted provider restoration, mid-database-transaction interruption, and Docker image rollback remain separate tests. No result from this harness certifies those lanes.

Run `node tests/upgrades/bson-fidelity.mjs` for a focused real-Mongo backup-format test. It creates and stops its own isolated temporary Mongo process, preserves canonical BSON numeric types (including negative zero), Decimal128, binary subtypes, timestamps and extended regex options, compares raw BSON bytes and ordered metadata, detects type-only mutations and refuses unsupported BSON. The full upgrade cases also contain typed data with server-side validators, so a lossy restore fails rather than passing a normalized checksum comparison. Backups made before the BSON-preserving proof format must be recreated.
