import assert from "node:assert/strict"
import { readdir, readFile, writeFile, rm, mkdir, copyFile } from "node:fs/promises"
import { spawn } from "node:child_process"
import { MongoClient } from "mongodb"
import {
  cleanEnvironment,
  loadState,
  readJSON,
  local,
} from "../../scripts/local/state.mjs"
import { databaseURL } from "../../scripts/local/database.mjs"
import { stopProcess, health } from "../../scripts/local/runtime.mjs"
const files = await readdir(".")
if (
  files.includes(".smartsite") ||
  files.some(file => file.startsWith(".env") && !file.endsWith(".example"))
)
  throw new Error("Configuration fixture requires a clean standalone export")
const original = await readFile("src/payload.config.ts", "utf8")
assert.ok(original.includes("smartsiteMcp({ enabled: true })"))
const run = script =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script], {
      env: cleanEnvironment(),
      stdio: "inherit",
    })
    child.once("error", reject)
    child.once("exit", code =>
      code === 0 ? resolve() : reject(new Error(`Fixture command failed ${code}`))
    )
  })
let client
try {
  await writeFile(
    "src/payload.config.ts",
    original.replace(
      "smartsiteMcp({ enabled: true })",
      "smartsiteMcp({ enabled: false })"
    )
  )
  await run("scripts/bootstrap-smartsite.mjs")
  const state = await loadState(),
    credentials = await readJSON(`${local}/credentials.json`)
  assert.equal((await health(state)).mcpEnabled, false)
  client = new MongoClient(databaseURL(state, credentials))
  await client.connect()
  assert.equal(await client.db().collection("payload-mcp-api-keys").countDocuments(), 0)
  assert.equal(
    (
      await fetch(`http://127.0.0.1:${state.appPort}/api/mcp`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      })
    ).status,
    404
  )
  await run("scripts/doctor-smartsite.mjs")
  await stopProcess(state.appProcess)
  await writeFile("src/payload.config.ts", original)
  await run("scripts/bootstrap-smartsite.mjs")
  assert.equal((await health(state)).siteId, state.siteId)
  assert.equal((await health(state)).mcpEnabled, true)
  assert.equal(await client.db().collection("payload-mcp-api-keys").countDocuments(), 1)
  console.log(
    JSON.stringify({
      passed: [
        "intentional-mcp-disable-startup",
        "no-key-created-when-disabled",
        "transport-absent",
        "doctor-understands-disabled",
        "reenable-preserves-site-and-creates-one-key",
      ],
    })
  )
} finally {
  await writeFile("src/payload.config.ts", original)
  await client?.close()
  await mkdir("test-results", { recursive: true })
  for (const file of ["app.log", "provision.log"])
    await copyFile(`${local}/${file}`, `test-results/${file}`).catch(() => {})
  let stopped = false
  try {
    const state = await loadState()
    await stopProcess(state.appProcess)
    await stopProcess(state.databaseProcess)
    stopped = true
  } catch (error) {
    console.error("Inspect fixture cleanup:", error.message)
  }
  if (stopped)
    for (const file of [".env", ".smartsite", ".mcp.json", ".codex/config.toml"])
      await rm(file, { recursive: true, force: true })
}
