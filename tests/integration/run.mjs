import assert from "node:assert/strict"
import { readdir, rm, mkdir, copyFile } from "node:fs/promises"
import { spawn } from "node:child_process"
import { MongoClient } from "mongodb"
import sharp from "sharp"
import {
  local,
  loadState,
  readJSON,
  cleanEnvironment,
} from "../../scripts/local/state.mjs"
import { stopProcess, environment } from "../../scripts/local/runtime.mjs"
import { databaseURL } from "../../scripts/local/database.mjs"
import { mcpRequest } from "../../scripts/local/clients.mjs"
const files = await readdir(".")
if (
  files.some(f => f.startsWith(".env") && !f.endsWith(".example")) ||
  files.includes(".smartsite")
)
  throw new Error("Integration tests require a clean export without private state")
const run = (args, env = cleanEnvironment()) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { env, stdio: "inherit" })
    child.on("error", reject)
    child.on("exit", code =>
      code === 0 ? resolve() : reject(new Error(`Child failed ${code}`))
    )
  })
let client
try {
  await run(["scripts/bootstrap-smartsite.mjs"])
  const state = await loadState(),
    credentials = await readJSON(`${local}/credentials.json`)
  client = new MongoClient(databaseURL(state, credentials))
  await client.connect()
  const db = client.db(state.databaseName)
  const counts = async () => ({
    users: await db.collection("users").countDocuments(),
    keys: await db.collection("payload-mcp-api-keys").countDocuments(),
    pages: await db.collection("pages").countDocuments(),
  })
  const before = await counts()
  assert.equal(before.pages, 0)
  assert.equal(before.users, 1)
  assert.equal(before.keys, 1)
  await run(["scripts/bootstrap-smartsite.mjs"])
  assert.deepEqual(await counts(), before)
  await run(
    ["--import", "tsx", "tests/integration/contracts.ts"],
    await environment(state)
  )
  const call = async (name, args, key = credentials) =>
    JSON.parse(
      (await mcpRequest(state, key, "tools/call", { name, arguments: args })).content[0]
        .text
    )
  const catalogue = await call("smartsiteRead", { action: "catalogue" })
  assert.equal(catalogue.siteId, state.siteId)
  assert.ok(!catalogue.collections.includes("users"))
  await assert.rejects(call("smartsiteRead", { action: "find", target: "users" }))
  const settings = await call("smartsiteRead", { action: "get", target: "settings" })
  const globalSave = await call("smartsiteSave", {
    action: "update",
    target: "settings",
    mode: "live",
    operationId: crypto.randomUUID(),
    expectedRevision: settings.revision,
    data: {
      general: { ...settings.document.general, siteName: "Standalone acceptance" },
    },
  })
  assert.deepEqual(globalSave.warnings, [])
  const home = await fetch(`http://127.0.0.1:${state.appPort}/`).then(r => r.text())
  assert.ok(home.includes("Standalone acceptance"))
  const op = {
    action: "create",
    target: "pages",
    mode: "draft",
    operationId: crypto.randomUUID(),
    data: {
      title: "Acceptance page",
      slug: "acceptance",
      sections: [{ blockType: "hero", heading: "A real standalone preview" }],
    },
  }
  const created = await call("smartsiteSave", op)
  const id = created.document.id
  assert.equal((await call("smartsiteSave", op)).document.id, id)
  await assert.rejects(call("smartsiteSave", { ...op, data: { title: "Different" } }))
  assert.equal(
    (await call("smartsiteOperationStatus", { operationId: op.operationId })).status,
    "committed"
  )
  let current = await call("smartsiteRead", { action: "get", target: "pages", id })
  const base = {
    action: "update",
    target: "pages",
    id,
    mode: "draft",
    expectedRevision: current.revision,
  }
  const concurrent = await Promise.allSettled(
    ["Winner A", "Winner B"].map(title =>
      call("smartsiteSave", {
        ...base,
        operationId: crypto.randomUUID(),
        data: { title },
      })
    )
  )
  assert.equal(concurrent.filter(r => r.status === "fulfilled").length, 1)
  const publicDoc = async () => {
    const r = await fetch(`http://127.0.0.1:${state.appPort}/api/pages/${id}`)
    return r.ok ? await r.json() : null
  }
  assert.equal(await publicDoc(), null)
  current = await call("smartsiteRead", { action: "get", target: "pages", id })
  const published = await call("smartsiteSave", {
    ...base,
    expectedRevision: current.revision,
    mode: "publish",
    operationId: crypto.randomUUID(),
    data: { title: "Public title" },
  })
  assert.deepEqual(published.warnings, [])
  assert.equal((await publicDoc()).title, "Public title")
  assert.equal((await fetch(`http://127.0.0.1:${state.appPort}/acceptance`)).status, 200)
  current = await call("smartsiteRead", { action: "get", target: "pages", id })
  await call("smartsiteSave", {
    ...base,
    expectedRevision: current.revision,
    mode: "draft",
    operationId: crypto.randomUUID(),
    data: { title: "Private draft title" },
  })
  assert.equal((await publicDoc()).title, "Public title")
  current = await call("smartsiteRead", { action: "get", target: "pages", id })
  const renamed = await call("smartsiteSave", {
    ...base,
    expectedRevision: current.revision,
    mode: "publish",
    operationId: crypto.randomUUID(),
    data: { slug: "acceptance-renamed", title: "Public title" },
  })
  assert.deepEqual(renamed.warnings, [])
  const redirected = await fetch(`http://127.0.0.1:${state.appPort}/acceptance`, {
    redirect: "manual",
  })
  assert.ok(redirected.status >= 300 && redirected.status < 400)
  assert.ok(redirected.headers.get("location").endsWith("/acceptance-renamed"))
  assert.equal(
    (await fetch(`http://127.0.0.1:${state.appPort}/acceptance-renamed`)).status,
    200
  )
  current = await call("smartsiteRead", { action: "get", target: "pages", id })
  await call("smartsiteSave", {
    ...base,
    expectedRevision: current.revision,
    mode: "unpublish",
    operationId: crypto.randomUUID(),
    data: { title: "Unpublished title" },
  })
  assert.equal(await publicDoc(), null)
  assert.equal((await fetch(`http://127.0.0.1:${state.appPort}/acceptance`)).status, 404)
  const image = await sharp({
    create: { width: 16, height: 16, channels: 3, background: "#6633cc" },
  })
    .png()
    .toBuffer()
  const upload = {
    operationId: crypto.randomUUID(),
    base64: image.toString("base64"),
    alt: "Purple test square",
  }
  const media = await call("smartsiteUploadMedia", upload)
  assert.equal(
    (await call("smartsiteUploadMedia", upload)).document.id,
    media.document.id
  )
  assert.equal(
    (await call("smartsiteUploadMedia", { ...upload, operationId: crypto.randomUUID() }))
      .document.id,
    media.document.id
  )
  const owner = await db.collection("users").findOne({ username: "owner" })
  await db.collection("users").updateOne(
    { _id: owner._id },
    {
      $set: {
        email: "private-sentinel@example.test",
        privateSentinel: "never-expose-this",
      },
    }
  )
  const post = await call("smartsiteSave", {
    action: "create",
    target: "posts",
    mode: "draft",
    operationId: crypto.randomUUID(),
    data: {
      title: "Author privacy",
      slug: "author-privacy",
      authors: [String(owner._id)],
    },
  })
  assert.ok(!JSON.stringify(post).includes("private-sentinel"))
  assert.ok(!JSON.stringify(post).includes("never-expose-this"))
  const key = await db
    .collection("payload-mcp-api-keys")
    .findOne({ label: `local-${state.siteId}` })
  const rest = await fetch(`http://127.0.0.1:${state.appPort}/api/users`, {
    headers: { Authorization: `payload-mcp-api-keys API-Key ${credentials.mcpKey}` },
  })
  assert.ok([401, 403].includes(rest.status), `MCP key accepted on REST: ${rest.status}`)
  await db
    .collection("payload-mcp-api-keys")
    .updateOne({ _id: key._id }, { $set: { "payload-mcp-tool.smartsiteSave": false } })
  await assert.rejects(call("smartsiteSave", { ...op, operationId: crypto.randomUUID() }))
  await call("smartsiteRead", { action: "catalogue" })
  await db
    .collection("payload-mcp-api-keys")
    .updateOne({ _id: key._id }, { $set: { enableAPIKey: false } })
  await assert.rejects(call("smartsiteRead", { action: "catalogue" }))
  console.log(
    JSON.stringify({
      passed: [
        "repeat-setup",
        "empty-start",
        "identity",
        "excluded-users",
        "operation-replay",
        "conflicting-operation",
        "concurrent-writers",
        "draft-publish-unpublish",
        "media-reuse",
        "private-author",
        "rest-denial",
        "read-only",
        "revoked-key",
      ],
    })
  )
} finally {
  await mkdir("test-results", { recursive: true, mode: 0o700 })
  for (const name of ["provision.log", "app.log"])
    await copyFile(`${local}/${name}`, `test-results/${name}`).catch(() => {})
  await client?.close()
  let stopped = false
  try {
    const state = await loadState()
    await stopProcess(state.appProcess)
    await stopProcess(state.databaseProcess)
    stopped = true
  } catch (error) {
    console.error("Inspect fixture cleanup:", error.message)
  }
  if (stopped) {
    await rm(".env", { force: true })
    await rm(".smartsite", { recursive: true, force: true })
    await rm(".mcp.json", { force: true })
    await rm(".codex/config.toml", { force: true })
  }
}
