import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { readdir, readFile, writeFile, mkdir, rm } from "node:fs/promises"
import { MongoClient } from "mongodb"
import {
  loadState,
  readJSON,
  local,
  cleanEnvironment,
} from "../../scripts/local/state.mjs"
import { databaseURL } from "../../scripts/local/database.mjs"
import { stopProcess } from "../../scripts/local/runtime.mjs"
import { readAdminCompileSummary } from "../../scripts/local/admin-readiness.mjs"
const files = await readdir(".")
if (
  files.some(f => f.startsWith(".env") && !f.endsWith(".example")) ||
  files.includes(".smartsite")
)
  throw new Error("Resume test requires a clean disposable export")
const run = (args, extra = {}) =>
  new Promise((resolve, reject) => {
    const p = spawn(process.execPath, args, {
      env: cleanEnvironment(extra),
      stdio: "inherit",
    })
    p.on("error", reject)
    p.on("exit", code => resolve(code))
  })
const stages = [
  "discovered",
  "prerequisites-ready",
  "database-process-recorded",
  "database-ready",
  "essentials-ready",
  "app-process-recorded",
  "app-ready",
  "client-configured",
  "server-mcp-verified",
]
let client
let doctorExitCode
const completedCheckpoints = []
try {
  let siteId
  for (const stage of stages) {
    assert.equal(
      await run(
        [
          "--import",
          "./tests/fixtures/interrupt-bootstrap.mjs",
          "scripts/bootstrap-smartsite.mjs",
        ],
        { SMARTSITE_TEST_INTERRUPT_STAGE: stage }
      ),
      19,
      stage
    )
    const state = await loadState()
    siteId ??= state.siteId
    assert.equal(state.siteId, siteId)
    completedCheckpoints.push(stage)
    console.log(JSON.stringify({ interrupted: stage, identityPreserved: true }))
  }
  assert.equal(await run(["scripts/bootstrap-smartsite.mjs"]), 0)
  assert.ok(!(await readFile(`${local}/app.log`, "utf8")).includes("GET /admin/login"), "Admin route must be cold before doctor")
  doctorExitCode = await run(["scripts/doctor-smartsite.mjs"])
  assert.equal(doctorExitCode, 0)
  const state = await loadState(),
    credentials = await readJSON(local + "/credentials.json")
  client = await new MongoClient(databaseURL(state, credentials)).connect()
  const db = client.db()
  assert.equal(await db.collection("users").countDocuments(), 1)
  assert.equal(await db.collection("payload-mcp-api-keys").countDocuments(), 1)
  assert.equal(await db.collection("smartsite-identities").countDocuments(), 1)
  assert.equal(await db.collection("pages").countDocuments(), 0)
  console.log(
    JSON.stringify({
      passed: [
        "resume-every-durable-startup-stage",
        "resume-partial-database-initialization",
        "resume-partial-app-start",
        "stable-identity",
        "no-duplicate-essentials",
        "read-only-doctor",
        "cold-admin-readiness",
      ],
    })
  )
} finally {
  // Keep only allowlisted compiler/timing diagnostics after disposable state cleanup.
  try {
    await mkdir("test-results", { recursive: true, mode: 0o700 })
    await writeFile("test-results/startup-diagnostics.json", JSON.stringify({ completedCheckpoints, doctorExitCode, compilation: await readAdminCompileSummary() }, null, 2) + "\n", { mode: 0o600 })
  } catch {
    console.error("Could not retain sanitized startup diagnostics; continuing owned-process cleanup")
  }
  await client?.close()
  const state = await loadState()
  await stopProcess(state.appProcess)
  await stopProcess(state.databaseProcess)
  for (const name of [".env", ".smartsite", ".mcp.json", ".codex/config.toml"])
    await rm(name, { recursive: true, force: true })
}
