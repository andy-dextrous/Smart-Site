import test from "node:test"
import assert from "node:assert/strict"
import { runScheduledPublishing, scheduledPublishingTargets } from "../../src/payload/jobs/run-scheduled"
import { startPublicationPoller } from "../../src/website/publication/poller"

test("scheduled jobs remain untouched unless native targets opt in", async () => {
  const payload = {
    config: { collections: [{ slug: "pages", versions: { drafts: { schedulePublish: false } } }], globals: [] },
    jobs: { run: async () => { throw new Error("Disabled scheduling must not inspect or claim jobs") } },
  }
  assert.deepEqual(await runScheduledPublishing(payload as any), {
    enabled: false, attempted: 0, succeeded: 0, failed: 0, infrastructureError: false,
  })
})

test("native opt-in builds target-specific, exclusive document/global job constraints", async () => {
  let invocation: any
  const config = {
    collections: [
      { slug: "pages", versions: { drafts: { schedulePublish: true } } },
      { slug: "posts", versions: { drafts: { schedulePublish: false } } },
      { slug: "media", versions: false },
      { slug: "users", versions: false, auth: {} },
    ],
    globals: [{ slug: "notice", versions: { drafts: { schedulePublish: { timeFormat: "HH:mm" } } } }],
  }
  assert.deepEqual(scheduledPublishingTargets(config as any), { collections: ["pages"], globals: ["notice"] })
  const result = await runScheduledPublishing({ config, jobs: { run: async (args: any) => {
    invocation = args
    return { jobStatus: { a: { status: "success" }, b: { status: "failed" } } }
  } } } as any)
  assert.deepEqual(result, { enabled: true, attempted: 2, succeeded: 1, failed: 1, infrastructureError: false })
  assert.deepEqual(invocation, {
    queue: "default", processingOrder: "waitUntil", limit: 5, sequential: true,
    where: { and: [{ taskSlug: { equals: "schedulePublish" } }, { "input.user.relationTo": { in: ["users"] } }, { "input.user.value": { exists: true } }, { or: [
      { and: [{ "input.doc.relationTo": { in: ["pages"] } }, { "input.doc.value": { exists: true } }, { "input.global": { exists: false } }] },
      { and: [{ "input.global": { in: ["notice"] } }, { "input.doc": { exists: false } }] },
    ] }] },
  })
})

test("background polling requires deliberate opt-in and authentication", t => {
  const oldFlag = process.env.SMARTSITE_BACKGROUND_RECOVERY
  const oldSecret = process.env.CRON_SECRET
  const key = Symbol.for("smartsite.publication.poller")
  const scope = globalThis as any
  const oldTimer = scope[key]
  delete scope[key]
  let starts = 0, unrefs = 0
  t.mock.method(globalThis, "setInterval", () => { starts++; return { unref: () => unrefs++ } as any })
  try {
    process.env.CRON_SECRET = "fixture-secret"
    delete process.env.SMARTSITE_BACKGROUND_RECOVERY
    startPublicationPoller()
    assert.equal(starts, 0)
    process.env.SMARTSITE_BACKGROUND_RECOVERY = "true"
    delete process.env.CRON_SECRET
    startPublicationPoller()
    assert.equal(starts, 0)
    process.env.CRON_SECRET = "fixture-secret"
    startPublicationPoller()
    startPublicationPoller()
    assert.equal(starts, 1)
    assert.equal(unrefs, 1)
  } finally {
    if (oldFlag === undefined) delete process.env.SMARTSITE_BACKGROUND_RECOVERY
    else process.env.SMARTSITE_BACKGROUND_RECOVERY = oldFlag
    if (oldSecret === undefined) delete process.env.CRON_SECRET
    else process.env.CRON_SECRET = oldSecret
    if (oldTimer === undefined) delete scope[key]
    else scope[key] = oldTimer
  }
})
