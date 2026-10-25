import assert from "node:assert/strict"
import { readdir, readFile, writeFile, rm, mkdir, copyFile, rmdir } from "node:fs/promises"
import { constants } from "node:fs"
import { spawn, execFile } from "node:child_process"
import { promisify } from "node:util"
import { MongoClient } from "mongodb"
import sharp from "sharp"
import {
  local,
  loadState,
  readJSON,
  cleanEnvironment,
} from "../../scripts/local/state.mjs"
import { stopProcess, environment, startApp } from "../../scripts/local/runtime.mjs"
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
const cacheProbeDirectory = "src/app/api/review-publication-probe"
const cacheProbeRoute = `${cacheProbeDirectory}/route.ts`
let installedCacheProbe = false
let originalPages
const scheduledFixture = process.argv.includes("--scheduled")
const withoutRunnerSecret = process.argv.includes("--without-runner-secret")
if (scheduledFixture && !(process.argv.includes("--routing") && process.argv.includes("--production")))
  throw new Error("Scheduled publishing fixture requires --routing --production")
if (withoutRunnerSecret && process.argv.includes("--routing"))
  throw new Error("Secret-free acceptance and authenticated fault injection are separate fixtures")
let client
try {
  if (scheduledFixture) {
    originalPages = await readFile("src/collections/pages.ts", "utf8")
    assert.ok(originalPages.includes("schedulePublish: false,"))
    await writeFile("src/collections/pages.ts", originalPages.replace("schedulePublish: false,", "schedulePublish: true,"))
  }
  // Materialize only in the clean disposable production fixture. Never include
  // this diagnostic endpoint in a normal source tree or deployment build.
  if (process.argv.includes("--routing") && process.argv.includes("--production")) {
    await mkdir(cacheProbeDirectory, { recursive: true })
    await copyFile(
      "tests/fixtures/publication-cache-probe/route.ts",
      cacheProbeRoute,
      constants.COPYFILE_EXCL
    )
    installedCacheProbe = true
  }
  await run(["scripts/bootstrap-smartsite.mjs"])
  const state = await loadState(),
    credentials = await readJSON(`${local}/credentials.json`)
  if (withoutRunnerSecret) {
    await stopProcess(state.appProcess)
    const localEnv = await readFile(".env", "utf8")
    await writeFile(".env", localEnv.replace(/^CRON_SECRET=.*\r?\n?/gm, "").replace(/^SMARTSITE_BACKGROUND_RECOVERY=.*\r?\n?/gm, ""))
    assert.ok(!(await environment(state)).CRON_SECRET)
    if (!process.argv.includes("--production")) await startApp(state)
  }
  if (process.argv.includes("--production")) {
    await stopProcess(state.appProcess)
    const env = { ...(await environment(state)), NODE_ENV: "production" }
    await run(["node_modules/payload/bin.js", "generate:types"], env)
    await run(["node_modules/payload/bin.js", "generate:importmap"], env)
    await run(["--import", "tsx", "scripts/generate-sitemap-index.ts"], env)
    await run(["node_modules/next/dist/bin/next", "build"], env)
    await startApp(state, { mode: "production" })
  }
  await run(["scripts/doctor-smartsite.mjs"])
  if (!scheduledFixture) {
    const login = await fetch(`http://127.0.0.1:${state.appPort}/api/users/login`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: "owner", password: credentials.adminPassword }),
    })
    assert.equal(login.status, 200)
    const { token } = await login.json()
    const response = await fetch(`http://127.0.0.1:${state.appPort}/api/publication`, {
      headers: { authorization: `JWT ${token}` },
    })
    assert.equal(response.status, 200)
    assert.deepEqual((await response.json()).scheduled, { enabled: false, attempted: 0, succeeded: 0, failed: 0, infrastructureError: false })
  }
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
  const origin = `http://127.0.0.1:${state.appPort}`
  const sitemapPaths = async () => {
    const response = await fetch(`${origin}/sitemap/pages.xml`)
    assert.equal(response.status, 200)
    assert.match(response.headers.get("content-type"), /xml/)
    const xml = await response.text()
    return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => {
      const url = new URL(match[1])
      assert.equal(url.origin, origin)
      return url.pathname
    })
  }
  // Warm the real metadata route before content exists. This catches both the
  // async Next sitemap ID contract and stale full-route/data cache results.
  assert.deepEqual(await sitemapPaths(), [])
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
  assert.deepEqual(await sitemapPaths(), [], "Draft leaked into sitemap")
  current = await call("smartsiteRead", { action: "get", target: "pages", id })
  const published = await call("smartsiteSave", {
    ...base,
    expectedRevision: current.revision,
    mode: "publish",
    operationId: crypto.randomUUID(),
    data: { title: "Public title" },
  })
  assert.deepEqual(published.warnings, [])
  assert.ok(published.publicationWorkIds.length > 0)
  assert.equal(published.publication.total, published.publicationWorkIds.length)
  assert.equal((await publicDoc()).title, "Public title")
  assert.equal((await fetch(`http://127.0.0.1:${state.appPort}/acceptance`)).status, 200)
  assert.ok((await sitemapPaths()).includes("/acceptance"), "Published URL missing from warmed sitemap")
  current = await call("smartsiteRead", { action: "get", target: "pages", id })
  await call("smartsiteSave", {
    ...base,
    expectedRevision: current.revision,
    mode: "draft",
    operationId: crypto.randomUUID(),
    data: { title: "Private draft title" },
  })
  assert.equal((await publicDoc()).title, "Public title")
  assert.ok((await sitemapPaths()).includes("/acceptance"), "Private draft hid published URL")
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
  const renamedSitemap = await sitemapPaths()
  assert.ok(renamedSitemap.includes("/acceptance-renamed"), "Renamed URL missing from sitemap")
  assert.ok(!renamedSitemap.includes("/acceptance"), "Old URL remains in sitemap")
  current = await call("smartsiteRead", { action: "get", target: "pages", id })
  await call("smartsiteSave", {
    ...base,
    expectedRevision: current.revision,
    mode: "draft",
    operationId: crypto.randomUUID(),
    data: { title: "Newer private draft before unpublish" },
  })
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
  assert.equal(
    (await fetch(`http://127.0.0.1:${state.appPort}/acceptance-renamed`)).status,
    404
  )
  assert.equal((await fetch(`http://127.0.0.1:${state.appPort}/acceptance`)).status, 404)
  const unpublishedSitemap = await sitemapPaths()
  assert.ok(!unpublishedSitemap.includes("/acceptance-renamed"), "Unpublished URL remains in sitemap")
  assert.ok(!unpublishedSitemap.includes("/acceptance"))
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
  if (installedCacheProbe) {
    await run(["tests/routing/mcp-publication-http.mjs"], await environment(state))
    await run(["tests/routing/search-publication-http.mjs"], await environment(state))
    // This fixture has now configured a real homepage, so the warmer can also
    // verify its mandatory root target while discovering nested published URLs.
    const { stdout } = await promisify(execFile)(process.execPath,
      ["--import", "tsx", "scripts/warm-cache.ts"],
      { env: { ...(await environment(state)), BASE_URL: origin }, timeout: 60000 })
    assert.ok(stdout.split("\n").includes(`WARMED 200 ${origin}/routeparentnewunique/searchleaf`),
      "Cache warmer did not discover the published page through the sitemap index")
    console.log(stdout.trim())
    if (scheduledFixture)
      await run(["tests/routing/scheduled-publication-http.mjs"], await environment(state))
    await run(["tests/routing/independent-http.mjs"], await environment(state))
  }
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
  if (process.argv.includes("--routing")) {
    // HTTP/production cache checks are complete; isolate deterministic claim tests
    // from the serving process's recovery poller.
    await stopProcess(state.appProcess)
    await run(["--import", "tsx", "tests/routing/contracts.ts"], await environment(state))
    if (process.argv.includes("--scale")) {
      await run(
        ["--import", "tsx", "tests/routing/independent-midbatch.ts"],
        await environment(state)
      )
      await run(["--import", "tsx", "tests/routing/scale.ts"], await environment(state))
    }
  }
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
        "warmed-sitemap-draft-publish-rename-unpublish",
        ...(installedCacheProbe ? ["cache-warmer-discovers-published-sitemap-URL"] : []),
        "media-reuse",
        "private-author",
        "rest-denial",
        "read-only",
        "revoked-key",
      ],
    })
  )
} finally {
  if (originalPages !== undefined) await writeFile("src/collections/pages.ts", originalPages)
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
  if (installedCacheProbe) {
    await rm(cacheProbeRoute, { force: true })
    await rmdir(cacheProbeDirectory).catch(error => {
      if (error.code !== "ENOTEMPTY" && error.code !== "ENOENT") throw error
    })
    // The test build also contains the endpoint; do not leave it deployable.
    await rm(".next", { recursive: true, force: true })
  }
  if (stopped) {
    await rm(".env", { force: true })
    await rm(".smartsite", { recursive: true, force: true })
    await rm(".mcp.json", { force: true })
    await rm(".codex/config.toml", { force: true })
  }
}
