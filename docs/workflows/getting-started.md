# Getting started

Open this repository in Codex or Claude Code and ask it to set up the site. The project includes the skills and deterministic helpers it needs. You do not need the SmartSite CLI, an embedded AI chat account, a model API key, a component registry or the repository that produced this starter.

The supported runtime target is Node 24.22.1 (or a newer Node 24 patch), pnpm 10.34.8 and MongoDB 8. Setup uses an installed `mongod` binary to start its own authenticated, loopback-only single-node replica set. It does not change a shared Mongo service. Mongo transactions are required for checked content writes.

On macOS, install the native Node build for your architecture and MongoDB Community from MongoDB’s official package repository. On Linux/Windows use the official packages for the actual distribution/architecture. Do not start a shared database service just for SmartSite. Native startup/process-ownership automation currently uses `ps`; Windows lifecycle support is not yet certified. Docker is an optional deployment route, not required for normal macOS local development. See the actual platform evidence in the release notes before assuming parity.

The agent installs dependencies with `pnpm install --frozen-lockfile`. For a fresh local site it runs `pnpm bootstrap`. It can supply a private JSON request via `node scripts/bootstrap-smartsite.mjs --request .smartsite/local/setup-request.json`:

    { "schemaVersion": 1, "siteName": "Example Studio", "email": "owner@example.test" }

Do not put passwords in arguments or chat. Setup generates them under ignored `.smartsite/local/credentials.json` with restrictive permissions. `.env`, local data, process receipts, logs and client connection files stay private and never belong in an export. Each fresh clone receives its own site ID, database, keys and ports. Never copy private state to another clone.

Bootstrap creates only an owner account, settings, local identity and scoped MCP key. It creates no business pages or sample posts. If it fails, address the reported problem and rerun; it reuses existing records and preserves owner-edited settings. Existing `.env` without matching local state means inspect/upgrade, not overwrite. There is no reset flag.

After setup, reconnect the `smartsite` MCP server in the client. Accept the client’s own project trust prompt if requested. Setup does not change global trust or permission policies. Call `smartsiteRead` with `action: catalogue` and compare its identity with doctor. Server verification and client verification are separate: config-file presence is not evidence of a working client connection.

For an existing local site, `pnpm doctor` reports actual database/app/MCP readiness without changing content. `pnpm local:start` resumes owned processes; `pnpm local:stop` stops only proven owned processes and preserves data. A process on the requested port is never killed automatically. Open the returned URL and `/admin` in an external browser.

The agent can now build your requested site using `smartsite-build`. Local media needs no provider account. Email delivery is inert locally. Choose hosting later when preparing an actual launch.

If an existing pnpm launcher cannot select the pinned version, use `npx --yes pnpm@10.34.8 install --frozen-lockfile` under the supported Node. Do not repair or replace unrelated global package-manager installations. Subsequent scripts can likewise use `npx --yes pnpm@10.34.8 <script>`. In browser verification, inspect the actual login labels (Email or Username) rather than assuming an email-only input selector.
