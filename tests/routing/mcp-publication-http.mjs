import assert from "node:assert/strict"
import { loadState, local, readJSON } from "../../scripts/local/state.mjs"
import { environment } from "../../scripts/local/runtime.mjs"
import { mcpRequest } from "../../scripts/local/clients.mjs"
const state = await loadState(),
  env = await environment(state)
const credentials = await readJSON(`${local}/credentials.json`)
const origin = `http://127.0.0.1:${state.appPort}`
const call = async (name, args) =>
  JSON.parse(
    (await mcpRequest(state, credentials, "tools/call", { name, arguments: args }))
      .content[0].text
  )
async function probe(action, extra = {}) {
  const response = await fetch(`${origin}/api/review-publication-probe`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.CRON_SECRET}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ action, ...extra }),
    signal: AbortSignal.timeout(90000),
  })
  assert.equal(response.status, 200, `Probe ${action} failed`)
  return response.json()
}
await probe("prepare")
const operation = {
  action: "create",
  target: "pages",
  mode: "publish",
  operationId: crypto.randomUUID(),
  data: {
    title: "MCP publication receipt",
    slug: "mcp-publication-receipt",
    sections: [{ blockType: "hero", heading: "Committed once" }],
  },
}
const fault = await probe("mcp-cache-failure", { operation, mcpKey: credentials.mcpKey })
assert.equal(fault.status, 200)
assert.ok(fault.called > 0, "Real MCP request did not reach injected cache failure")
const wire = JSON.parse(
  fault.body.startsWith("data:") || fault.body.includes("\ndata:")
    ? fault.body
        .split("\n")
        .find(line => line.startsWith("data:"))
        .slice(5)
    : fault.body
)
assert.ok(!wire.error && !wire.result?.isError)
const saved = JSON.parse(wire.result.content[0].text)
assert.equal(saved.committed, true)
assert.ok(saved.publicationWorkIds.length > 0, "Committed MCP save lost publication IDs")
assert.equal(saved.publication.total, saved.publicationWorkIds.length)
assert.ok(
  saved.publication.work.every(
    work => work.status === "pending" && !work.cacheAcknowledgedAt
  )
)
assert.ok(saved.warnings.some(warning => warning.includes("refresh remains pending")))
const status = await call("smartsiteOperationStatus", {
  operationId: operation.operationId,
})
assert.equal(status.status, "committed")
assert.deepEqual(status.result.publicationWorkIds, saved.publicationWorkIds)
assert.ok(status.result.publication.work.every(work => work.status === "pending"))
const replay = await call("smartsiteSave", operation)
assert.equal(replay.replayed, true)
assert.equal(replay.document.id, saved.document.id)
assert.deepEqual(replay.publicationWorkIds, saved.publicationWorkIds)
assert.ok(replay.publication.work.every(work => work.status === "pending"))
const recovered = await probe("ack-order", { ids: saved.publicationWorkIds })
assert.equal(recovered.prematureCompletion, false)
assert.ok(recovered.after.work.every(work => work.status === "completed"))
const final = await call("smartsiteOperationStatus", {
  operationId: operation.operationId,
})
assert.deepEqual(final.result.publicationWorkIds, saved.publicationWorkIds)
assert.ok(final.result.publication.work.every(work => work.status === "completed"))
const template = await call("smartsiteSave", {
  action: "create",
  target: "templates",
  mode: "live",
  operationId: crypto.randomUUID(),
  data: {
    name: "MCP publication receipt template",
    sections: [{ blockType: "hero", heading: "Template receipt" }],
  },
})
assert.ok(template.publicationWorkIds.length > 0, "Template save lost publication IDs")
assert.equal(template.publication.total, template.publicationWorkIds.length)
console.log(
  JSON.stringify({
    passed: [
      "MCP-save-retains-publication-IDs",
      "MCP-save-reports-cache-failure-pending",
      "MCP-status-and-replay-preserve-work-IDs",
      "MCP-status-observes-completion-after-recovery",
      "MCP-template-save-retains-publication-IDs",
    ],
  })
)
