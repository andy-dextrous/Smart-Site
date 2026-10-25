import assert from "node:assert/strict"
import { MongoClient, ObjectId } from "mongodb"
import { loadState, local, readJSON } from "../../scripts/local/state.mjs"
import { environment } from "../../scripts/local/runtime.mjs"
import { databaseURL } from "../../scripts/local/database.mjs"
import { mcpRequest } from "../../scripts/local/clients.mjs"

const state = await loadState(), credentials = await readJSON(`${local}/credentials.json`)
const env = await environment(state), origin = `http://127.0.0.1:${state.appPort}`
const runnerHeaders = { authorization: `Bearer ${env.CRON_SECRET}` }
const client = new MongoClient(databaseURL(state, credentials))
await client.connect()
const db = client.db(state.databaseName)
async function probe(action, extra = {}) {
  const response = await fetch(`${origin}/api/review-publication-probe`, {
    method: "POST", headers: { ...runnerHeaders, "content-type": "application/json" },
    body: JSON.stringify({ action, ...extra }),
  })
  assert.equal(response.status, 200, `Probe ${action}`)
  return response.json()
}
async function call(name, args) {
  return JSON.parse((await mcpRequest(state, credentials, "tools/call", { name, arguments: args })).content[0].text)
}
async function login(email, password) {
  const response = await fetch(`${origin}/api/users/login`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }),
  })
  assert.equal(response.status, 200)
  return (await response.json()).token
}
async function run(headers = runnerHeaders) {
  const response = await fetch(`${origin}/api/publication`, { headers })
  return { status: response.status, body: await response.json() }
}
async function publicPage(visible) {
  const response = await fetch(`${origin}/native-schedule-proof`)
  assert.equal(response.status, visible ? 200 : 404)
  if (visible) assert.match(await response.text(), /NATIVE SCHEDULE HEADING/)
}
const scheduled = (doc, user, type, waitUntil, extra = {}) => probe("scheduled-queue", {
  task: "schedulePublish", queue: "default", waitUntil,
  input: { type, doc: { relationTo: "pages", value: doc }, user: { relationTo: "users", value: user } },
  ...extra,
})
try {
  await probe("prepare") // Disables only this fixture's poller for deterministic runner calls.
  // Earlier privacy assertions intentionally change the fixture owner's email.
  const owner = await db.collection("users").findOne({ username: "owner" })
  assert.ok(owner)
  const ownerToken = await login(owner.email, credentials.adminPassword)
  const ownerHeaders = { authorization: `JWT ${ownerToken}` }
  const password = crypto.randomUUID() + crypto.randomUUID()
  const created = await fetch(`${origin}/api/users`, {
    method: "POST", headers: { ...ownerHeaders, "content-type": "application/json" },
    body: JSON.stringify({ email: "schedule-editor@example.test", username: "schedule-editor", name: "Schedule", lastName: "Fixture", role: "editor", password }),
  })
  assert.equal(created.status, 201)
  const editor = (await created.json()).doc
  const editorToken = await login(editor.email, password)
  const page = await call("smartsiteSave", {
    action: "create", target: "pages", mode: "draft", operationId: crypto.randomUUID(),
    data: { title: "Native scheduled publication", slug: "native-schedule-proof", sections: [{ blockType: "hero", heading: "NATIVE SCHEDULE HEADING" }] },
  })
  const id = page.document.id
  const deadline = Date.now() + 5000
  const future = await scheduled(id, editor.id, "publish", new Date(deadline).toISOString())
  const early = await run()
  assert.equal(early.status, 200)
  assert.equal(early.body.scheduled.enabled, true)
  assert.equal(early.body.scheduled.attempted, 0)
  await publicPage(false)
  await new Promise(resolve => setTimeout(resolve, Math.max(0, deadline - Date.now() + 100)))
  for (const headers of [{}, { authorization: "Bearer wrong-secret" }, { authorization: `JWT ${editorToken}` }])
    assert.equal((await run(headers)).status, 403)
  const statusOnly = await fetch(`${origin}/api/publication?status`, { headers: ownerHeaders })
  assert.equal(statusOnly.status, 200)
  const retryOnly = await fetch(`${origin}/api/publication`, { method: "POST", headers: { ...ownerHeaders, "content-type": "application/json" }, body: "{}" })
  assert.equal(retryOnly.status, 200)
  await publicPage(false)
  const published = await run()
  assert.equal(published.status, 200)
  assert.equal(published.body.scheduled.succeeded, 1)
  await publicPage(true)
  const publishedAgain = await run()
  assert.equal(publishedAgain.body.scheduled.attempted, 0)
  assert.equal(await db.collection("payload-jobs").countDocuments({ _id: new ObjectId(future.id) }), 0)
  const work = await db.collection("site-publication-work").find({ source: `pages/${id}` }).toArray()
  assert.ok(work.length > 0)
  assert.ok(work.every(row => row.status === "completed" && row.cacheAcknowledgedAt))
  await scheduled(id, editor.id, "unpublish", new Date(Date.now() - 1000).toISOString())
  const unpublished = await run(ownerHeaders)
  assert.equal(unpublished.status, 200)
  assert.equal(unpublished.body.scheduled.succeeded, 1)
  await publicPage(false)
  // Create out of order: due time, rather than insertion order, must win.
  await scheduled(id, editor.id, "unpublish", new Date(Date.now() - 1000).toISOString())
  await scheduled(id, editor.id, "publish", new Date(Date.now() - 2000).toISOString())
  const ordered = await run()
  assert.equal(ordered.body.scheduled.succeeded, 2)
  await publicPage(false)
  const unrelated = await probe("scheduled-queue", { task: "dependent-uri-updates", queue: "default", input: {} })
  const otherQueue = await scheduled(id, editor.id, "publish", new Date(Date.now() - 1000).toISOString(), { queue: "fixture-other" })
  assert.equal((await run()).body.scheduled.attempted, 0)
  for (const queued of [unrelated, otherQueue]) {
    const row = await db.collection("payload-jobs").findOne({ _id: new ObjectId(queued.id) })
    assert.ok(row && row.processing === false && !row.completedAt)
  }
  // Old schedules for disabled targets and malformed mixed targets must stay byte-identical.
  // Insert raw historical rows because the opted-in schema only offers Pages scheduling.
  const historicalBase = await db.collection("payload-jobs").findOne({ _id: new ObjectId(otherQueue.id) })
  const preserved = [
    { ...historicalBase, _id: new ObjectId(), queue: "default", waitUntil: new Date(Date.now() - 1000), input: { ...historicalBase.input, doc: { relationTo: "posts", value: id } } },
    { ...historicalBase, _id: new ObjectId(), queue: "default", waitUntil: new Date(Date.now() - 1000), input: { ...historicalBase.input, global: "settings" } },
    { ...historicalBase, _id: new ObjectId(), queue: "default", waitUntil: new Date(Date.now() - 1000), input: { ...historicalBase.input, doc: { relationTo: "pages" } } },
    { ...historicalBase, _id: new ObjectId(), queue: "default", waitUntil: new Date(Date.now() - 1000), input: { global: "settings", type: "publish", user: historicalBase.input.user } },
    { ...historicalBase, _id: new ObjectId(), queue: "default", waitUntil: new Date(Date.now() - 1000), input: { type: "publish", doc: { relationTo: "pages", value: id } } },
    { ...historicalBase, _id: new ObjectId(), queue: "default", waitUntil: new Date(Date.now() - 1000), input: { type: "publish", doc: { relationTo: "pages", value: id }, user: null } },
    { ...historicalBase, _id: new ObjectId(), queue: "default", waitUntil: new Date(Date.now() - 1000), input: { type: "publish", doc: { relationTo: "pages", value: id }, user: editor.id } },
  ]
  await db.collection("payload-jobs").insertMany(preserved)
  assert.equal((await run()).body.scheduled.attempted, 0)
  for (const original of preserved)
    assert.deepEqual(await db.collection("payload-jobs").findOne({ _id: original._id }), original)
  const failed = await scheduled(id, editor.id, "publish", new Date(Date.now() - 1000).toISOString())
  const removed = await fetch(`${origin}/api/users/${editor.id}`, { method: "DELETE", headers: ownerHeaders })
  assert.equal(removed.status, 200)
  const rejected = await run()
  assert.equal(rejected.status, 503)
  assert.equal(rejected.body.scheduled.failed, 1)
  await publicPage(false)
  const failedRow = await db.collection("payload-jobs").findOne({ _id: new ObjectId(failed.id) })
  assert.equal(failedRow.hasError, true)
  assert.equal(failedRow.processing, false)
  console.log(JSON.stringify({ passed: ["future-native-schedule-stays-private", "scheduled-runner-auth", "status-and-retry-do-not-execute-schedules", "due-native-publish-and-cache", "due-native-unpublish", "due-time-order", "unrelated-tasks-and-queues-untouched", "missing-scheduler-user-fails-closed", "disabled-and-malformed-historical-jobs-preserved"] }))
} finally {
  await client.close()
}
