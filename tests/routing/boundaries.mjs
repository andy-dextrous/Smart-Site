import assert from "node:assert/strict"
import { readdir, writeFile, mkdir, copyFile, chmod, rm } from "node:fs/promises"
import { spawn } from "node:child_process"
import { MongoClient } from "mongodb"
import {
  cleanEnvironment,
  loadState,
  local,
  readJSON,
} from "../../scripts/local/state.mjs"
import { environment, startApp, stopProcess } from "../../scripts/local/runtime.mjs"
import { databaseURL } from "../../scripts/local/database.mjs"
import { mcpRequest } from "../../scripts/local/clients.mjs"

const files = await readdir(".")
if (
  files.includes(".smartsite") ||
  files.some(file => file.startsWith(".env") && !file.endsWith(".example"))
)
  throw new Error("Publication boundary tests require a clean disposable export")
const run = (args, env = cleanEnvironment()) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { env, stdio: "inherit" })
    child.once("error", reject)
    child.once("exit", code =>
      code === 0 ? resolve() : reject(new Error(`Boundary fixture failed: ${code}`))
    )
  })
let mongo
try {
  await run(["scripts/bootstrap-smartsite.mjs", "--prepare-only"])
  const state = await loadState()
  const credentials = await readJSON(`${local}/credentials.json`)
  await run(["--import", "tsx", "tests/routing/boundaries.ts"], await environment(state))
  const fixture = await readJSON(`${local}/publication-boundaries.json`)
  assert.equal(fixture.pages.length, fixture.batchSize)
  assert.equal(fixture.posts.length, 2)
  assert.equal(fixture.services.length, 1)
  mongo = new MongoClient(databaseURL(state, credentials))
  await mongo.connect()
  const db = mongo.db(state.databaseName)
  const names = [
    "pages",
    "posts",
    "services",
    "_pages_versions",
    "_posts_versions",
    "_services_versions",
    "uri-indexes",
    "redirects",
    "searches",
  ]
  const snapshot = async () =>
    Object.fromEntries(
      await Promise.all(
        names.map(async name => [
          name,
          await db.collection(name).find({}).sort({ _id: 1 }).toArray(),
        ])
      )
    )
  const before = await snapshot()
  assert.ok(before._posts_versions.length > 0 && before._services_versions.length > 0)
  // No production-cache claim: this focused suite uses the real dev HTTP runtime.
  // The existing production routing suite separately verifies warm cache delivery.
  await startApp(state)
  const origin = `http://127.0.0.1:${state.appPort}`
  const call = async (name, args) => {
    const wire = await mcpRequest(state, credentials, "tools/call", {
      name,
      arguments: args,
    })
    assert.ok(!wire.isError, `MCP ${name} failed`)
    return JSON.parse(wire.content[0].text)
  }
  async function visible(group, expected, forbidden = []) {
    for (const { uri } of group) {
      const response = await fetch(`${origin}${uri}`)
      assert.equal(response.status, 200, uri)
      const html = await response.text()
      // Inspect rendered headings, not matching strings inside hydration scripts.
      const headings = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map(match =>
        match[1].replace(/<[^>]+>/g, "")
      )
      assert.ok(headings.includes(expected), `${uri} did not render ${expected}`)
      for (const text of forbidden)
        assert.ok(!headings.includes(text), `${uri} rendered another template's content`)
    }
  }
  async function editTemplate(id, heading) {
    const current = await call("smartsiteRead", {
      action: "get",
      target: "templates",
      id,
    })
    const operation = {
      action: "update",
      target: "templates",
      id,
      mode: "live",
      operationId: crypto.randomUUID(),
      expectedRevision: current.revision,
      data: {
        sections: current.document.sections.map(section => ({ ...section, heading })),
      },
    }
    const saved = await call("smartsiteSave", operation)
    assert.equal(saved.committed, true)
    assert.ok(saved.publicationWorkIds.length > 0)
    assert.deepEqual(saved.warnings, [])
    const status = await call("smartsiteOperationStatus", {
      operationId: operation.operationId,
    })
    assert.equal(status.status, "committed")
    assert.deepEqual(status.result.publicationWorkIds, saved.publicationWorkIds)
    assert.ok(
      status.result.publication.work.every(
        work => work.status === "completed" && work.cacheAcknowledgedAt
      )
    )
    const replay = await call("smartsiteSave", operation)
    assert.equal(replay.replayed, true)
    assert.deepEqual(replay.publicationWorkIds, saved.publicationWorkIds)
  }
  await visible(fixture.pages, "Template A original")
  await visible(fixture.posts, "Template B original")
  await visible(fixture.services, "Independent service content")
  await editTemplate(fixture.templateA, "Template A updated")
  await visible(fixture.pages, "Template A updated", [
    "Template A original",
    "Template B original",
  ])
  await visible(fixture.posts, "Template B original", ["Template A updated"])
  await visible(fixture.services, "Independent service content", [
    "Template A updated",
    "Template B original",
  ])
  await editTemplate(fixture.templateB, "Template B updated")
  await visible(fixture.posts, "Template B updated", [
    "Template B original",
    "Template A updated",
  ])
  await visible(fixture.pages, "Template A updated", ["Template B updated"])
  await visible(fixture.services, "Independent service content", [
    "Template A updated",
    "Template B updated",
  ])
  assert.deepEqual(
    await snapshot(),
    before,
    "Template edits changed dependent/unrelated authored data, versions or route identities"
  )
  const result = {
    passed: [
      "zero-one-exact-terminal-batches",
      "cache-acknowledgment-order",
      "all-25-live-page-template-dependants",
      "second-live-post-template-group",
      "unrelated-service-isolation",
      "source-versions-index-identities-preserved",
      "native-MCP-receipt-replay-status",
    ],
    cases: fixture.cases,
    templateGroups: [fixture.pages.length, fixture.posts.length],
    unrelatedServices: 1,
    httpRuntime: "development",
  }
  await mkdir("test-results", { recursive: true, mode: 0o700 })
  await writeFile(
    "test-results/routing-boundaries.json",
    JSON.stringify(result, null, 2) + "\n"
  )
  console.log(JSON.stringify(result))
} finally {
  await mongo?.close()
  await mkdir("test-results", { recursive: true, mode: 0o700 })
  for (const name of ["app.log", "provision.log"]) {
    const path = `test-results/routing-boundaries-${name}`
    await copyFile(`${local}/${name}`, path)
      .then(() => chmod(path, 0o600))
      .catch(() => {})
  }
  // If ownership/stop fails, throw and retain the private state for recovery.
  const state = await loadState().catch(error => {
    if (error.code !== "ENOENT") throw error
  })
  if (state) {
    await stopProcess(state.appProcess)
    await stopProcess(state.databaseProcess)
    for (const path of [".env", ".smartsite", ".mcp.json", ".codex/config.toml", ".next"])
      await rm(path, { recursive: true, force: true })
  }
}
