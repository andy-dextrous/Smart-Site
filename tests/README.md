# Standalone verification

Failed browser runs retain a private app log in ignored `test-results/browser/` before cleaning up. Inspect it locally; do not publish raw logs or credentials as acceptance evidence.

Run from this repository with its pinned Node and pnpm. Unit tests are safe in a working site. The other local suites require a **disposable copy without environment files or `.smartsite` state** and refuse an initialized site. Run them sequentially in that copy; each owns its database, generated secrets and process cleanup.

| Command | Evidence |
| --- | --- |
| `pnpm type-check` / `pnpm lint` | Source and dependency compatibility |
| `pnpm test:unit` | Projection, nested references, state atomicity and ownership |
| `pnpm test:integration` | Real Payload HTTP/MCP, permissions, drafts, conflicts, uploads and recovery |
| `pnpm test:startup` | Abrupt exit at each saved setup stage, then resume with one identity/account/key |
| `pnpm test:transfer` | Two independent sites, explicit author mapping, global review and safe retry |
| `pnpm test:build` | Real production build against its own disposable database |
| `pnpm test:acceptance` | Real Chromium frontend, mobile, form submission, public byline, draft isolation and CMS editor |
| `pnpm test:docker-upgrade` | Optional Docker rehearsal: populated standalone Mongo → authenticated replica set, restart and backup recovery on separate storage |

For browser acceptance, install the pinned runner's browser with `pnpm exec playwright install chromium` first. This is test tooling, not a requirement for ordinary site startup. The suite saves screenshots and a result under ignored `test-results/browser/`; review them, since DOM assertions cannot certify visual quality. It uses no remote email delivery or production services. Docker acceptance creates a randomly named Compose project and removes only its own containers and volumes.

Independent client acceptance remains a separate test: open a clean export in each supported agent, ask it to start and build a site using only its shipped instructions, reconnect the project MCP server through the client's normal trust flow, and verify actual tool discovery. Record failures and required human actions honestly. Server-only checks cannot prove client configuration or skill discovery.

If a fixture cannot clean up, retain its private state and inspect ownership. Never kill a port or delete an unrelated database to get a green result.
