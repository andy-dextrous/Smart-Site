# Troubleshooting

Use `smartsite-repair` and run `pnpm doctor` before changing state. Read private logs locally and summarize the error without credentials or content dumps.

| Symptom | Check and recovery |
| --- | --- |
| Node prerequisite fails | Use `.node-version` and packageManager in package.json; reinstall with the frozen lock. |
| Mongo cannot start | Check `mongod --version`, private mongo.log and recorded port. Install Mongo through its official OS instructions. Never kill an unrelated listener. |
| Copied local state / identity mismatch | Preserve the folder for recovery. Make a fresh copy without `.env`, `.smartsite`, `.mcp.json` or generated Codex config, then bootstrap. Never silently adopt another database. |
| Setup interrupted | Rerun bootstrap in the same directory. It validates identity, reuses the database, and fills missing essential records. An active lock means wait; malformed ownership needs inspection. |
| Mongo stopped | Resume bootstrap; it restarts only the recorded project database and retains data. |
| MCP is absent | Confirm app health, generated project config and the client's normal trust/enablement. Reconnect the client; call catalogue and compare site ID. Never print the headers helper output. |
| Key revoked/disabled | Inspect the CMS MCP key record. Do not widen grants or resurrect a deliberately revoked key. Create/rotate a scoped key only within the owner's request and update the private local config. |
| Save timed out | Query operation status with the same UUID. Committed means verify, not repeat. Unknown permits identical retry. A revision conflict requires reading and reconciling. |
| Image storage-pending | Read the private smartsite-uploads reservation using a trusted operator and inspect the exact digest-named files/objects and media records. If a matching committed media record exists, reconcile the reservation to its ID after validation. Otherwise remove only proven abandoned owned files, then remove that reservation and retry the identical request. Never delete existing user media or clear all reservations. |
| Private state lost | Preserve the database/files and recover credentials from backup. Do not generate replacement credentials into an existing database or run a seed. |
| Preview stale after committed save | Verify current content and refresh its route. Do not replay a live write to fix cache rendering. |

For schema errors read the target field/block schema. Arrays replace the entire array: preserve unrelated rows and row IDs. For accidental content edits use version history and deliberately restore selected fields against the current revision. Whole-database restore is a different, explicitly targeted operation with a backup and downtime implications.
