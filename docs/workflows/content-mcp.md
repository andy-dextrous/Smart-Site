# Content through MCP

Payload’s official `@payloadcms/plugin-mcp` serves `/api/mcp`. The project exposes four bounded tools. It does not expose source editing, shell commands, raw databases, account management or an unchecked parallel content-write route.

| Tool | Use |
| --- | --- |
| `smartsiteRead` | catalogue, focused schema, find, get, history, version |
| `smartsiteSave` | one revision-checked create/update with explicit publication mode |
| `smartsiteUploadMedia` | PNG/JPEG/WebP bytes up to 2 MiB, with alt text |
| `smartsiteOperationStatus` | reconcile a lost response by operationId |

Start with catalogue and confirm the site/environment. `schema` accepts target, optional field path and block slug. `find` accepts a bounded limit/page and Payload where filter. `get` returns the latest draft plus revision. Globals use their slug without a document ID. Content targets are pages, posts, services, team, testimonials, templates, categories, media, forms, redirects, header, footer and settings when present. Accounts, keys, jobs, submissions and internal routing/search state are excluded.

Read before writing. For an update supply action, target, id for collections, changed data, expectedRevision, a new UUID operationId and mode. Arrays replace whole arrays: preserve unaffected rows and their IDs. Never supply system IDs/timestamps or `_status` as a patch; choose mode instead. Draft-capable targets accept draft/publish/unpublish. Other targets require live, which changes them immediately.

A stale revision fails. Read again and reconcile the user’s intended change with the newer document. A timeout means unknown outcome: call operation status. Identical operationId/input replays its receipt; changed input with the same ID fails. Cache warnings are separate from committed writes. Do not duplicate a successful mutation to repair preview refresh.

For recovery, inspect history and one version, select the fields to restore, and save them against the current revision. History is evidence, not a command to restore a whole record. For media upload, prepare bytes locally; the tool accepts no remote URL or arbitrary server path. Identical image bytes reuse existing media without rewriting its alt text. Use CMS upload for larger files or other formats.

Read back the changed fields and inspect the actual preview/public page. Confirm draft/public state, navigation and images. Ordinary CMS editing remains available without an agent. A rejected key is a connection/permission issue, not a reason to use a legacy shared secret or direct database write.
