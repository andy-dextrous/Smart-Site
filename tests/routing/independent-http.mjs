import assert from "node:assert/strict"
import { loadState } from "../../scripts/local/state.mjs"
import { environment } from "../../scripts/local/runtime.mjs"
const state = await loadState(),
  env = await environment(state)
const origin = `http://127.0.0.1:${state.appPort}`
async function probe(action, extra = {}) {
  const response = await fetch(`${origin}/api/review-publication-probe`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.CRON_SECRET}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ action, ...extra }),
    signal: AbortSignal.timeout(60000),
  })
  assert.equal(response.status, 200, `Probe ${action} failed`)
  return response.json()
}
await probe("prepare")
const profile = await probe("unrouted-profile")
assert.ok(profile.skipped >= 1)
assert.equal((await fetch(`${origin}${profile.uri}`)).status, 200)
const { id } = await probe("create")
const read = () => fetch(`${origin}/independent-cache-probe`).then(r => r.text())
assert.match(await read(), /INDEPENDENT OLD HEADING/)
const { ids } = await probe("edit", { id })
assert.ok(ids.length)
assert.match(await read(), /INDEPENDENT OLD HEADING/)
const failure = await probe("reject-cache", { ids })
assert.ok(failure.called)
assert.ok(failure.status.work.every(work => work.status !== "completed"))
assert.ok(failure.status.work.every(work => !work.cacheAcknowledgedAt))
// Partial invalidation before a backend rejection is allowed; durable completion is not.
const recovery = await probe("ack-order", { ids })
assert.equal(recovery.prematureCompletion, false)
assert.equal(recovery.delivered, true)
assert.ok(recovery.after.work.every(work => work.status === "completed"))
assert.match(await read(), /INDEPENDENT NEW HEADING/)
console.log(
  JSON.stringify({
    independentPassed: [
      ...profile.passed,
      "real-next-cache-backend-rejection-remains-pending",
      "warmed-output-stays-old-before-delivery-attempt",
      "no-completion-before-backend-ack",
      "retry-refreshes-warmed-production-route",
    ],
  })
)
