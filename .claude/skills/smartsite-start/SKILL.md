---
name: smartsite-start
description: Prepare or resume this SmartSite locally, diagnose first startup, and connect this project’s Payload MCP to Codex or Claude.
---

# SmartSite start

Paths below are relative to this project root (the folder containing package.json).

Read `docs/workflows/getting-started.md`. Inspect existing `.env` and local state by filename and non-secret status, without printing credentials. A configured project should be diagnosed before restarting; a fresh clone should use the project bootstrap helper. The helper owns generated credentials, independent Mongo database/ports, essential account/settings, and client config. No global SmartSite package, hosted AI account, or model API key belongs in setup.

A request to set up this local project supplies permission for its empty local database and preview. Do not ask for a hosting decision or repeat permission for each mechanical step. Ask only for missing information that changes the result; a temporary local site name and private local login are fine. Existing content is never a reason to seed or reset. If setup stops, run it again after addressing the reported cause; preserve its private state.

After bootstrap, connect/reconnect the client’s `smartsite` MCP entry. Respect the client’s own trust dialog. Use `smartsiteRead` with action `catalogue` and compare site identity with doctor. Do not mark a client connected because a config file exists or a curl request worked. If tools are absent, diagnose the connection; do not use legacy control APIs or silently bypass access through a database script.

Open the returned preview URL in an external browser and inspect `/admin`. Report the URL, readiness and any actual missing prerequisite. Do not print the admin password or MCP key; point the owner to the private credential file if needed.

Examples: “Show me this site” means reconnect to the current runtime. “Set up a new site” means independent local state. “It stopped working” means doctor and evidence, not reset.

If an existing pnpm launcher cannot select the pinned version, use `npx --yes pnpm@10.34.8 install --frozen-lockfile` under the supported Node. Do not repair or replace unrelated global package-manager installations. Subsequent scripts can likewise use `npx --yes pnpm@10.34.8 <script>`. In browser verification, inspect the actual login labels (Email or Username) rather than assuming an email-only input selector.

Self-hosting is opt-in. A fresh starter and normal local/hosted setup must have no `.smartsite-self-hosted/` directory or generated `smartsite-deployment.json`. Only after the owner chooses self-hosting, follow the deployment guide: initialize the manifest, configure the destination, then prepare its private environment. The helpers create the directory when needed. Preserve existing self-hosted state when upgrading; never delete it as cleanup.
