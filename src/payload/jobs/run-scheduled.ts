import type { Payload, SanitizedConfig, Where } from "payload"

/** Native Payload configuration is the only source of scheduled-content opt-in. */
export function scheduledPublishingTargets(
  config: Pick<SanitizedConfig, "collections" | "globals">
) {
  const enabled = (item: { versions?: unknown }) => {
    const versions = item.versions as { drafts?: { schedulePublish?: unknown } } | false
    return Boolean(versions && versions.drafts && versions.drafts.schedulePublish)
  }
  return {
    collections: config.collections.filter(enabled).map(item => item.slug),
    globals: config.globals.filter(enabled).map(item => item.slug),
  }
}

/** Execute only deliberately enabled targets; old or malformed jobs remain untouched. */
export async function runScheduledPublishing(payload: Payload) {
  const targets = scheduledPublishingTargets(payload.config)
  const enabled = targets.collections.length + targets.globals.length > 0
  const summary = { enabled, attempted: 0, succeeded: 0, failed: 0, infrastructureError: false }
  if (!enabled) return summary

  const eligible: Where[] = []
  if (targets.collections.length) eligible.push({
    and: [
      { "input.doc.relationTo": { in: targets.collections } },
      { "input.doc.value": { exists: true } },
      { "input.global": { exists: false } },
    ],
  })
  if (targets.globals.length) eligible.push({
    and: [
      { "input.global": { in: targets.globals } },
      { "input.doc": { exists: false } },
    ],
  })
  try {
    const result = await payload.jobs.run({
      queue: "default",
      where: { and: [
        { taskSlug: { equals: "schedulePublish" } },
        // Native Payload treats an absent user as a system operation. Never
        // elevate an old identity-less schedule through this website runner.
        { "input.user.relationTo": { in: payload.config.collections.filter(item => item.auth).map(item => item.slug) } },
        { "input.user.value": { exists: true } },
        { or: eligible },
      ] },
      processingOrder: "waitUntil",
      limit: 5,
      sequential: true,
    })
    for (const job of Object.values(result.jobStatus || {})) {
      summary.attempted++
      if (job.status === "success") summary.succeeded++
      else summary.failed++
    }
  } catch (error) {
    summary.infrastructureError = true
    payload.logger.error({ err: error }, "Scheduled publishing could not finish")
  }
  return summary
}
