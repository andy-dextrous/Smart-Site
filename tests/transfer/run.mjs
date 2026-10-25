import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { mkdtemp, cp, readFile, writeFile, rm, access } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { MongoClient, ObjectId } from "mongodb"
import { cleanEnvironment, loadState, local } from "../../scripts/local/state.mjs"
import { environment, stopProcess } from "../../scripts/local/runtime.mjs"
const root = process.cwd()
for (const name of [".env", ".smartsite"]) {
  try {
    await access(name)
    throw new Error("Transfer test requires a clean disposable export")
  } catch (e) {
    if (e.code !== "ENOENT") throw e
  }
}
const target = await mkdtemp(path.join(os.tmpdir(), "smartsite-transfer-target-"))
const run = (cmd, args, cwd = root, env = cleanEnvironment()) =>
  new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd, env, stdio: "inherit" })
    p.on("error", reject)
    p.on("exit", code =>
      code === 0 ? resolve() : reject(new Error(`Helper failed (${code})`))
    )
  })
const node = (args, cwd = root, env) => run(process.execPath, args, cwd, env)
const json = async file => JSON.parse(await readFile(file, "utf8"))
const write = async (file, data) => writeFile(file, JSON.stringify(data), { mode: 0o600 })
let destClient
try {
  await cp(root, target, {
    recursive: true,
    filter: src =>
      ![
        "node_modules",
        ".next",
        ".git",
        ".smartsite",
        ".env",
        ".mcp.json",
        "test-results",
        "tsconfig.tsbuildinfo",
      ].some(p => path.relative(root, src).split(path.sep).includes(p)),
  })
  await run(
    "npx",
    ["--yes", "pnpm@10.34.8", "install", "--frozen-lockfile"],
    target
  )
  await node(["scripts/bootstrap-smartsite.mjs", "--prepare-only"])
  const source = await loadState()
  await node(
    ["--import", "tsx", "tests/transfer/seed.ts"],
    root,
    await environment(source)
  )
  const ids = await json(".smartsite/transfer-fixture.json")
  const bundleFile = path.join(root, ".smartsite/bundle.json"),
    exportReport = path.join(root, ".smartsite/export-report.json")
  const requestFile = path.join(root, ".smartsite/export-request.json")
  await write(requestFile, {
    schemaVersion: 1,
    action: "export",
    environmentFile: path.join(root, ".env"),
    expectedSiteId: source.siteId,
    operatorId: ids.owner,
    selection: [{ target: "posts", id: ids.post }, { target: "settings" }],
    bundleFile,
    reportFile: exportReport,
  })
  await node(["scripts/content-transfer/run.mjs", "--request", requestFile])
  const bundle = await json(bundleFile),
    report = await json(exportReport)
  assert.equal(bundle.items.length, 3)
  assert.ok(bundle.externalReferences.some(r => r.target === "users"))
  assert.ok(!JSON.stringify(bundle).includes("owner@smartsite.local"))
  await node(["scripts/bootstrap-smartsite.mjs", "--prepare-only"], target)
  const destEnv = Object.fromEntries(
    (await readFile(path.join(target, ".env"), "utf8"))
      .trim()
      .split("\n")
      .map(l => {
        const i = l.indexOf("=")
        return [l.slice(0, i), JSON.parse(l.slice(i + 1))]
      })
  )
  destClient = await new MongoClient(destEnv.DATABASE_URL).connect()
  const db = destClient.db()
  const owner = await db.collection("users").findOne({ username: "owner" })
  const importFile = path.join(target, ".smartsite/import.json"),
    importReport = path.join(target, ".smartsite/report.json")
  const request = {
    schemaVersion: 1,
    action: "import",
    environmentFile: path.join(target, ".env"),
    expectedSiteId: destEnv.SMARTSITE_SITE_ID,
    operatorId: String(owner._id),
    bundleFile,
    bundleChecksum: report.bundleChecksum,
    reportFile: importReport,
  }
  await write(importFile, request)
  await assert.rejects(
    node(["scripts/content-transfer/run.mjs", "--request", importFile], target)
  )
  assert.equal(await db.collection("posts").countDocuments(), 0)
  request.referenceMappings = [
    { target: "users", sourceId: ids.owner, destinationId: String(owner._id) },
  ]
  await write(importFile, request)
  await node(["scripts/content-transfer/run.mjs", "--request", importFile], target)
  assert.equal((await json(importReport)).status, "dry-run")
  assert.equal(await db.collection("posts").countDocuments(), 0)
  request.apply = true
  request.approvedPublication = true
  const changed = await db
    .collection("globals")
    .updateOne(
      { globalType: "settings" },
      { $set: { "general.siteName": "Edited after dry run" } }
    )
  assert.equal(changed.matchedCount, 1)
  await write(importFile, request)
  await assert.rejects(
    node(["scripts/content-transfer/run.mjs", "--request", importFile], target)
  )
  assert.equal(await db.collection("posts").countDocuments(), 0)
  request.apply = false
  await write(importFile, request)
  await node(["scripts/content-transfer/run.mjs", "--request", importFile], target)
  request.apply = true
  await write(importFile, request)
  await node(["scripts/content-transfer/run.mjs", "--request", importFile], target)
  assert.equal(await db.collection("posts").countDocuments(), 1)
  const imported = await db.collection("posts").findOne({ slug: "portable-story" })
  assert.equal(String(imported.authors[0]), String(owner._id))
  const importedMedia = await db
    .collection("media")
    .findOne({ _id: new ObjectId(String(imported.featuredImage)) })
  assert.equal(importedMedia.alt, "Portable fixture image")
  assert.equal(await db.collection("media").countDocuments(), 1)
  await access(path.join(target, "public/media", importedMedia.filename))
  await node(["scripts/content-transfer/run.mjs", "--request", importFile], target)
  assert.equal(await db.collection("posts").countDocuments(), 1)
  // A second valid author cannot silently change the meaning of a saved receipt.
  const secondAuthor = new ObjectId()
  await db.collection("users").insertOne({
    _id: secondAuthor,
    username: "second-author",
    email: "second@example.test",
    name: "Second",
    role: "editor",
  })
  request.referenceMappings[0].destinationId = String(secondAuthor)
  request.apply = false
  await write(importFile, request)
  await assert.rejects(
    node(["scripts/content-transfer/run.mjs", "--request", importFile], target)
  )
  request.apply = true
  await write(importFile, request)
  await assert.rejects(
    node(["scripts/content-transfer/run.mjs", "--request", importFile], target)
  )
  assert.equal(
    String((await db.collection("posts").findOne({ slug: "portable-story" })).authors[0]),
    String(owner._id)
  )
  request.referenceMappings[0].destinationId = String(owner._id)
  await write(importFile, request)
  // Extra destination content must block a resumed import rather than be adopted.
  await db
    .collection("posts")
    .insertOne({ title: "Unrelated", slug: "unrelated", _status: "draft" })
  await assert.rejects(
    node(["scripts/content-transfer/run.mjs", "--request", importFile], target)
  )
  // A stale explicit mapping fails before effects, even with a saved receipt.
  request.referenceMappings[0].destinationId = String(new ObjectId())
  await write(importFile, request)
  await assert.rejects(
    node(["scripts/content-transfer/run.mjs", "--request", importFile], target)
  )
  console.log(
    JSON.stringify({
      passed: [
        "two-independent-sites",
        "reachable-media-transfer",
        "private-transfer-projection",
        "required-author-mapping",
        "dry-run-no-effects",
        "import-and-repeat",
        "global-transfer",
        "changed-global-dry-run-refusal",
        "populated-destination-refusal",
        "stale-reference-refusal",
        "receipt-author-mapping-drift-refusal",
      ],
    })
  )
} finally {
  await destClient?.close()
  for (const dir of [root, target]) {
    try {
      const state = await json(path.join(dir, ".smartsite/local/state.json"))
      await stopProcess(state.appProcess)
      await stopProcess(state.databaseProcess)
      for (const name of [".env", ".smartsite", ".mcp.json", ".codex/config.toml"])
        await rm(path.join(dir, name), { recursive: true, force: true })
    } catch (error) {
      console.error("Inspect private transfer fixture cleanup:", error.message)
    }
  }
  // Preserve target source and private worker error logs if cleanup failed.
  console.log(JSON.stringify({ fixtureFolder: target }))
}
