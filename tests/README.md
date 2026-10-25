# Standalone verification

Failed browser runs retain a private app log in ignored `test-results/browser/` before cleaning up. Inspect it locally; do not publish raw logs or credentials as acceptance evidence.

Run from this repository with its pinned Node and pnpm. Unit tests are safe in a working site. The other local suites require a **disposable copy without environment files or `.smartsite` state** and refuse an initialized site. Run them sequentially in that copy; each owns its database, generated secrets and process cleanup.

The transfer suite installs the second site's dependencies from its frozen lockfile. Allow network access for packages missing from that site's package store; a populated cache in the first site is not required or assumed.

| Command | Evidence |
| --- | --- |
| `pnpm type-check` / `pnpm lint` | Source and dependency compatibility |
| `pnpm test:unit` | Projection, nested references, state atomicity and ownership |
| `pnpm test:integration` | Real Payload HTTP/MCP, permissions, drafts, conflicts, uploads and recovery |
| `pnpm test:startup` | Abrupt exit at each saved setup stage, then resume with one identity/account/key and a cold CMS login request |
| `pnpm test:transfer` | Two independent sites, explicit author mapping, global review and safe retry |
| `pnpm test:build` | Real production build against its own disposable database |
| `pnpm test:preview` | Production HTTP preview, stale-cookie recovery, safe redirects and native document/field/breadcrumb permissions |
| `pnpm test:routing --boundaries` | Actual Mongo publication worker at zero/one/25 records, terminal empty batch, two live template groups and an unrelated collection through development HTTP/MCP; also included in every full routing run |
| `pnpm test:acceptance` | Real Chromium frontend, mobile, form submission, public byline, draft isolation and CMS editor |
| `pnpm test:docker-upgrade` | Optional Docker rehearsal: populated standalone Mongo → authenticated replica set, restart and backup recovery on separate storage |

The first browser search waits up to 60 seconds for its matching development-route response, verifies successful JSON containing the fixture page, then checks the visible result using the normal assertion deadline. The first CMS login navigation uses the same 180-second development compilation allowance as local startup and asserts HTTP 200; subsequent navigations retain their normal timeout. These checks record only sanitized status and elapsed time; they do not retry or relax other UI assertions.

For browser acceptance, install the pinned runner's browser with `pnpm exec playwright install chromium` first. This is test tooling, not a requirement for ordinary site startup. The suite saves screenshots and a result under ignored `test-results/browser/`; review them, since DOM assertions cannot certify visual quality. It uses no remote email delivery or production services. Docker acceptance creates a randomly named Compose project and removes only its own containers and volumes.

Independent client acceptance remains a separate test: open a clean export in each supported agent, ask it to start and build a site using only its shipped instructions, reconnect the project MCP server through the client's normal trust flow, and verify actual tool discovery. Record failures and required human actions honestly. Server-only checks cannot prove client configuration or skill discovery.

The startup suite retains sanitized compiler/timing metadata in `test-results/startup-diagnostics.json` before removing its disposable private state. It does not copy raw app logs into that report.

If a fixture cannot clean up, retain its private state and inspect ownership. Never kill a port or delete an unrelated database to get a green result.

### Full Docker application upgrade and rollback

Run `pnpm test:docker-app-upgrade` from a clean exported 4.0 release containing its `smartsite-export.json`. This downloads the immutable official 3.0.1 release, populates a real production application through HTTP MCP, relocates legacy Docker uploads with hash verification, runs the complete upgrade kit, promotes a native 4.0 prebuilt image, recreates its container, verifies publication recovery and original/variant media creation/deletion, then checks compatible old-code rollback and separate pre-cutover snapshot recovery. Account IDs, password hashes, drafts, content, database indexes and uploads are checked throughout.

Requires a local Docker daemon with Compose, Node 24, Corepack, Git, tar, network access, at least 16 GiB free in Docker's filesystem and enough RAM for one production Next build. It performs four sequential builds; do not run another memory-heavy build concurrently. Linux uses host networking only during the isolated image build so its loopback-only Mongo port is reachable; Docker Desktop uses its host gateway. All serving ports remain loopback-only.

An already downloaded official archive may be supplied with `node tests/fixtures/docker-app-upgrade.mjs --archive /absolute/3.0.1.tar.gz`; its pinned checksum is still required. `--keep` retains the test's owned resources after failure for diagnosis. Default cleanup removes only its unique Compose project/volumes and tagged images. Build cache is reusable Docker state; review its ownership before removing it. Private failure evidence is retained outside the site. Successful private fixtures are removed and a non-secret result is written to `test-results/docker-app-upgrade.json`. A failed assertion exits nonzero. Missing-file HTTP status is provider/framework-specific; deletion requires an unsuccessful HTTP response plus absence of the record and all persisted files.
