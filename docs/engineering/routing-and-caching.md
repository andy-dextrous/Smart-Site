# Routing, publication and caching

The catch-all route `src/app/(frontend)/[[...uri]]/page.tsx` delegates to the published URI renderer. A slug is one segment; a URI is the complete public path. The URI index connects that path to its source document, publication state, template and breadcrumbs.

Collections opt into routing through explicit native fields/hooks and `custom.smartsite.route`. Settings chooses the homepage and collection archive/template assignments. Homepage selection uses document identity; changing its slug does not move `/`. Reparent children and change archive assignments before deleting/trashing a referenced page. Cycles and excessive depth are rejected. Returning to an old canonical URL removes conflicting automatic redirects while preserving manual ones.

## Content saved versus website refreshed

A content save and its publication intent commit in the same database transaction. Draft-only edits do not replace published content. A successful content receipt means the content was committed; publication work may still be pending.

`site-publication-work` records pending, running, failed or completed work. Route reconciliation uses 25-document keyset batches, a persisted checkpoint and an expiring claim. Claim ownership/generation is checked at both ends of each batch transaction. An abandoned process can be replaced without allowing its stale work to commit. Derived URI/breadcrumb changes also update the existing public search projection in the same transaction. They do not rewrite source versions, private drafts or editor timestamps.

After routing work, the Next serving route invalidates cache tags and awaits actual cache delivery before marking the work completed. The pinned Next integration is isolated in `src/website/publication/cache-delivery.ts`; dependency upgrades must reverify that bridge in a production build. A plain Node script has no serving cache context and cannot certify cache completion.

Public URI, content, navigation, collection and template reads use cache tags. Save/delete hooks persist the required refresh work. Cache completion means dependencies are reconciled and invalidation acknowledged; it does not mean every page was eagerly rendered.

## Serving and recovery

Ordinary CMS/MCP saves drain committed publication work in the serving request. No cron, external scheduler, background poller or `CRON_SECRET` is required. The drain has a time budget: interrupted or large work can remain pending. Another successful authenticated mutation can drain it, or an administrator can explicitly call `POST /api/publication` with `{}`. Static public traffic does not guarantee recovery.

Background recovery is optional. On a persistent Node host, set `SMARTSITE_BACKGROUND_RECOVERY=true` and a separate random `CRON_SECRET` to enable the Next-process poller (every 10 seconds). On Vercel, the shipped configuration has no cron; add a runner only when wanted, using an appropriate hosting plan/cadence. The runner authenticates with `Authorization: Bearer <CRON_SECRET>`. Merely setting a secret does not enable polling. Multiple self-hosted serving instances need a shared cache/invalidation design before claiming the same guarantees.

Publication recovery is internal; the CMS keeps its existing controls. MCP operation status includes the related work state. Authenticated `GET /api/publication?status` returns operational diagnostics; administrators receive full details and ordinary editors receive only aggregate states. Administrators or the configured runner can execute recovery. Anonymous requests are denied. Administrator authentication works without a cron secret; bearer-runner authentication requires one. After five failed attempts, work remains failed until an administrator repairs the cause and retries it. Saved content is not deleted or repeated.

To diagnose a stale page:

1. Read the content receipt/current revision and confirm the intended published version.
2. Inspect the returned publication work IDs using MCP operation status with the original operation ID, or the authenticated diagnostics endpoint. Run `pnpm doctor` for the configured local runtime.
3. Inspect server logs using the work ID. Check database access, invalid hierarchy/assignments, runner authentication and cache delivery.
4. Repair the cause, then make an authenticated `POST /api/publication` with `{ "retryId": "<failed-work-id>" }` as an administrator or configured runner. Keep credentials private. Verify the public URL, redirects and relevant listings.
5. Confirm completed state and cache acknowledgement. Do not issue a new content mutation merely to make the old refresh disappear.

Useful modules are `src/website/routing`, `src/website/publication`, `src/website/cache` and the collection’s explicit lifecycle hooks. Use production build/start for cache acceptance; a working development preview is insufficient.

## Native scheduled publishing

Future publishing is off by default. To opt in, set `versions.drafts.schedulePublish: true` in each desired native collection/global definition and configure a runner at the required cadence. This restores Payload's existing Publish Later controls for that target; it does not install scheduling infrastructure. Pages, Posts, Services and the demo Workshops ship with `false`.

Authenticated `GET /api/publication` derives enabled targets from the final Payload config and runs up to five eligible due jobs from the default queue, ordered by due time, before draining website refresh work. With no opted-in targets it returns `scheduled.enabled: false` and never inspects or claims scheduled jobs. It leaves disabled targets, malformed mixed document/global targets, jobs without a restorable auth-collection/user reference, future jobs, other task types and other queues untouched. Native Payload otherwise permits a missing user to mean a system operation; the SmartSite runner never uses that fallback. Native Payload restores the scheduling user and checks that user’s permissions. Status-only GET and POST recovery do not execute schedules. A native task failure produces a 503 response with a bounded summary; committed website work still drains.

Native scheduled jobs retain Payload’s queue semantics. They do not have the fenced lease recovery used by SmartSite’s website refresh records. Avoid overlapping native runners. A process killed during a scheduled job can leave it marked processing; inspect the intended content, current version and native job before deliberately rescheduling through the existing CMS controls. Failed or legacy jobs with missing user identity must be reviewed and rescheduled, not silently replayed with elevated access. A successful runner invocation does not mean no future scheduled jobs exist.

Before opting in on an existing site, inspect unfinished native jobs and explicitly decide whether to preserve them paused or enable their targets with verified infrastructure. Overdue jobs can execute on the first opted-in runner request. See the [4.0 upgrade guide](../upgrades/4.0.0/README.md). Disabling a target does not delete its jobs. These limits describe the SmartSite runner; an administrator invoking Payload's generic jobs runner or custom external code controls that separate execution path.
