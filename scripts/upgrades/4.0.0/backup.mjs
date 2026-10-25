import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import {
  mkdir,
  readFile,
  copyFile,
  chmod,
  open,
  readdir,
  lstat,
  writeFile,
} from "node:fs/promises"
import path from "node:path"
import { randomUUID } from "node:crypto"
import readline from "node:readline"
import { createReadStream } from "node:fs"
import {
  loadRequest,
  json,
  save,
  digest,
  sourceHashes,
  safePath,
  readOptional,
} from "./common.mjs"
import {
  connect,
  snapshotDatabase,
  compareSnapshots,
  readBackupDocuments,
  readIndexes,
} from "./mongo.mjs"
const context = await loadRequest()
const { request, fingerprint } = context
const inspection = await json(path.join(request.reportDirectory, "inspection.json"))
if (inspection.fingerprint !== fingerprint)
  throw new Error("Inspection does not match this request")
if (
  JSON.stringify(await sourceHashes(request.siteRoot, Object.keys(inspection.hashes))) !==
  JSON.stringify(inspection.hashes)
)
  throw new Error("Source changed since inspection")
if (
  !context.restoreEnv.DATABASE_URL ||
  context.restoreEnv.DATABASE_URL === context.env.DATABASE_URL
)
  throw new Error(
    "Supply a distinct, disposable DATABASE_URL in restoreEnvironmentFile for the mandatory restore check"
  )
const source = await connect(context)
const restored = await connect(context, context.restoreEnv.DATABASE_URL)
const backupRoot = path.join(request.reportDirectory, "backup")
let ownsRestore = false
try {
  if (source.db.databaseName === restored.db.databaseName)
    throw new Error("Restore database must have a distinct name")
  const checkpointFile = path.join(request.reportDirectory, "backup-checkpoint.json")
  const checkpointBytes = await readOptional(checkpointFile)
  const checkpoint = checkpointBytes
    ? JSON.parse(checkpointBytes)
    : { fingerprint, token: randomUUID(), status: "copying-and-restoring" }
  if (checkpoint.fingerprint !== fingerprint)
    throw new Error("Backup belongs to a different request")
  if ((await restored.db.listCollections().toArray()).length) {
    const owner = await restored.db
      .collection("_smartsite_backup_owner")
      .findOne({ _id: "owner" })
    if (
      !process.argv.includes("--resume") ||
      !checkpointBytes ||
      owner?.token !== checkpoint.token
    )
      throw new Error(
        "Restore target is not empty. Only an owned interrupted restore can use --resume"
      )
    await restored.db.dropDatabase()
  }
  await save(checkpointFile, checkpoint)
  if (
    (await source.db.admin().command({ hello: 1 })).setName &&
    !(await restored.db.admin().command({ hello: 1 })).setName
  )
    throw new Error("Restore proof must use a replica set")
  const before = await snapshotDatabase(source.db, source.BSON, request.expectedSiteId)
  if (compareSnapshots(inspection.before, before).length)
    throw new Error("Database changed since inspection; freeze writes and inspect again")
  await mkdir(backupRoot, { recursive: true, mode: 0o700 })
  await mkdir(path.join(backupRoot, "database"), { recursive: true, mode: 0o700 })
  await restored.db
    .collection("_smartsite_backup_owner")
    .insertOne({ _id: "owner", token: checkpoint.token })
  ownsRestore = true
  const files = []
  for (const collection of before.collections) {
    const filename = `database/${Buffer.from(collection.name).toString("hex")}.jsonl`
    const handle = await open(path.join(backupRoot, filename), "w", 0o600)
    try {
      for await (const doc of readBackupDocuments(
        source.db,
        source.BSON,
        collection.name
      ))
        await handle.write(source.BSON.EJSON.stringify(doc, { relaxed: false }) + "\n")
    } finally {
      await handle.close()
    }
    const indexes = await readIndexes(source.db, source.BSON, collection.name)
    await save(
      path.join(backupRoot, `${filename}.indexes.json`),
      source.BSON.EJSON.serialize(indexes, { relaxed: false })
    )
    files.push({
      path: filename,
      sha256: digest(await readFile(path.join(backupRoot, filename))),
    })
    await save(path.join(backupRoot, `${filename}.options.json`), collection.options)
    for (const suffix of [".indexes.json", ".options.json"])
      files.push({
        path: filename + suffix,
        sha256: digest(await readFile(path.join(backupRoot, filename + suffix))),
      })
    const restoredOptions = source.BSON.EJSON.deserialize(
      await json(path.join(backupRoot, `${filename}.options.json`)),
      { relaxed: false }
    )
    await restored.db.createCollection(collection.name, restoredOptions)
    const lines = readline.createInterface({
      input: createReadStream(path.join(backupRoot, filename)),
      crlfDelay: Infinity,
    })
    let batch = []
    for await (const line of lines) {
      if (!line) continue
      batch.push(source.BSON.EJSON.parse(line, { relaxed: false }))
      if (batch.length === 200) {
        await restored.db.collection(collection.name).insertMany(batch)
        batch = []
      }
    }
    if (batch.length) await restored.db.collection(collection.name).insertMany(batch)
    const restoredIndexes = source.BSON.EJSON.deserialize(
      await json(path.join(backupRoot, `${filename}.indexes.json`)),
      { relaxed: false }
    )
    for (const index of restoredIndexes.filter(i => i.name !== "_id_")) {
      const { key, v, ns, ...options } = index
      await restored.db.collection(collection.name).createIndex(key, options)
    }
  }
  const proof = await snapshotDatabase(
    restored.db,
    restored.BSON,
    request.expectedSiteId,
    ["_smartsite_backup_owner"]
  )
  if (compareSnapshots(before, proof).length)
    throw new Error("Restored database differs from original snapshot")
  for (const file of Object.keys(inspection.hashes)) {
    const destination = safePath(path.join(backupRoot, "source"), file)
    await mkdir(path.dirname(destination), { recursive: true, mode: 0o700 })
    await copyFile(safePath(request.siteRoot, file), destination)
    await chmod(destination, 0o600)
  }
  if (
    JSON.stringify(
      await sourceHashes(path.join(backupRoot, "source"), Object.keys(inspection.hashes))
    ) !== JSON.stringify(inspection.hashes)
  )
    throw new Error("Source backup checksum mismatch")
  await copyFile(request.environmentFile, path.join(backupRoot, "environment.private"))
  await chmod(path.join(backupRoot, "environment.private"), 0o600)
  const media = []
  async function copyMedia(relative = "") {
    const from = safePath(path.join(request.siteRoot, "public/media"), relative)
    const entries = await readdir(from, { withFileTypes: true }).catch(e => {
      if (e.code === "ENOENT") return []
      throw e
    })
    for (const entry of entries) {
      const name = relative ? `${relative}/${entry.name}` : entry.name
      if (entry.isSymbolicLink())
        throw new Error("Media symlinks require a manual backup")
      if (entry.isDirectory()) await copyMedia(name)
      else if (entry.isFile()) {
        const dest = safePath(path.join(backupRoot, "media"), name)
        await mkdir(path.dirname(dest), { recursive: true, mode: 0o700 })
        await copyFile(safePath(path.join(request.siteRoot, "public/media"), name), dest)
        await chmod(dest, 0o600)
        media.push({ path: name, sha256: digest(await readFile(dest)) })
      }
    }
  }
  await copyMedia()
  const hostedMedia = []
  // Native storage adapters calculate URLs at read time; raw Mongo documents
  // often contain only filename/prefix. Resolve through the installed source.
  const inventoryRun = spawnSync(
    process.execPath,
    [
      "--import",
      path.join(request.siteRoot, "node_modules/tsx/dist/loader.mjs"),
      fileURLToPath(new URL("./media-inventory.mjs", import.meta.url)),
      "--request",
      context.requestFile,
    ],
    {
      cwd: request.siteRoot,
      env: { ...process.env, DISABLE_PAYLOAD_HMR: "true" },
      stdio: "inherit",
    }
  )
  if (inventoryRun.error || inventoryRun.status !== 0)
    throw new Error(
      "Unable to resolve complete media inventory through the existing storage adapter"
    )
  const inventory = await json(path.join(request.reportDirectory, "media-inventory.json"))
  if (inventory.fingerprint !== fingerprint)
    throw new Error("Media inventory identity mismatch")
  const urls = new Map()
  for (const item of inventory.files) {
    if (new URL(item.url).origin !== new URL(context.env.NEXT_PUBLIC_URL).origin)
      urls.set(item.url, [...(urls.get(item.url) || []), item])
    else if (!media.some(file => file.path === item.filename))
      throw new Error(
        `Media ${item.mediaId}/${item.variant} needs a verified provider backup; no local original exists`
      )
  }
  await mkdir(path.join(backupRoot, "hosted-media"), { recursive: true, mode: 0o700 })
  for (const [url, records] of urls) {
    if (
      new URL(url).protocol !== "https:" ||
      !request.allowedMediaHosts?.includes(new URL(url).hostname)
    )
      throw new Error(
        "Add each verified media hostname to allowedMediaHosts in the original request before inspection"
      )
    const response = await fetch(url, {
      signal: AbortSignal.timeout(30000),
      redirect: "error",
    })
    if (!response.ok) throw new Error("Hosted media backup download failed")
    const bytes = Buffer.from(await response.arrayBuffer())
    for (const record of records) {
      if (
        !Number.isSafeInteger(record.bytes) ||
        record.bytes < 0 ||
        bytes.length !== record.bytes
      )
        throw new Error(`Hosted media size mismatch: ${record.mediaId}/${record.variant}`)
      const contentType = response.headers
        .get("content-type")
        ?.split(";")[0]
        .trim()
        .toLowerCase()
      if (record.mimeType && contentType !== record.mimeType.toLowerCase())
        throw new Error(`Hosted media type mismatch: ${record.mediaId}/${record.variant}`)
    }
    const filename = `hosted-media/${digest(url)}`
    await writeFile(path.join(backupRoot, filename), bytes, { mode: 0o600 })
    const sha256 = digest(bytes)
    if (digest(await readFile(path.join(backupRoot, filename))) !== sha256)
      throw new Error("Hosted media backup checksum mismatch")
    hostedMedia.push({ url, path: filename, sha256, records })
  }
  if (
    compareSnapshots(
      before,
      await snapshotDatabase(source.db, source.BSON, request.expectedSiteId)
    ).length
  )
    throw new Error(
      "Database changed during backup; keep writes stopped and inspect again"
    )
  await save(path.join(request.reportDirectory, "backup-proof.json"), {
    schemaVersion: 1,
    metadataEncoding: "canonical-ejson-v2",
    fingerprint,
    restored: true,
    sourceCommit: inspection.commit,
    database: proof,
    files,
    media,
    hostedMedia,
  })
  console.log(
    JSON.stringify({
      status: "backup-restored-and-compared",
      collections: proof.collections.length,
      mediaFiles: media.length,
    })
  )
} finally {
  if (ownsRestore) await restored.db.dropDatabase()
  await restored.client.close()
  await source.client.close()
}
