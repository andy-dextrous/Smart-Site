---
name: smartsite-repair
description: Diagnose and fix SmartSite startup, MCP, routing, caching, media or preview failures while preserving existing data.
---

# SmartSite repair

Paths below are relative to this project root (the folder containing package.json).

Read `docs/workflows/troubleshooting.md` and the smallest workflow matching the observed failure. Start with doctor, exact error, target identity, server ownership and recent changes. Inspect private logs selectively without printing secrets. A successful HTTP status alone is not proof the intended site is running.

If Mongo is stopped, use the project lifecycle helper; never kill a process merely because it occupies the desired port. If MCP is missing, inspect project config, client trust/reconnect and key validity. Disabled keys stay disabled until the owner deliberately replaces them. If a save timed out, reconcile its receipt before retrying. If routing is stale, check publication, URI records, hooks and cache; do not reseed.

Make the smallest supported repair and retest the original failure in the actual app. Keep newer content and custom source. Back up before recovery that can lose data. Do not overwrite `.env`, rotate working credentials, reset Mongo, disable access checks or use production as a convenient local fallback.

Example: “The homepage is blank” may be an unpublished page, missing home assignment or render error. Read the evidence before choosing one. “Port already in use” requires ownership diagnosis, not kill-port. Report the verified outcome and any remaining acceptance gap.
