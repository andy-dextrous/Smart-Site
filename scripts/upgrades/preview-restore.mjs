// Explicit, isolated preview restoration. This is never bootstrap or adoption.
import { randomBytes, randomUUID } from "node:crypto"
import { readFile, writeFile, mkdir, copyFile, access, chmod } from "node:fs/promises"
import path from "node:path"
import readline from "node:readline"
import { createReadStream } from "node:fs"
import { MongoClient, BSON } from "mongodb"
import {
  root,
  local,
  lock,
  loadState,
  saveState,
  atomicJSON,
  freePort,
  runNode,
} from "../local/state.mjs"
import { ensureDatabase, databaseURL } from "../local/database.mjs"
import { environment } from "../local/runtime.mjs"
import { json, digest, safePath } from "./4.0.0/common.mjs"
import { snapshotDatabase, compareSnapshots, BSON_READ_OPTIONS } from "./4.0.0/mongo.mjs"
const unlock = await lock()
try {
  const flag = process.argv.indexOf("--source-site-id")
  const sourceSiteId = process.argv[flag + 1]
  if (flag < 0 || !sourceSiteId || sourceSiteId.startsWith("--"))
    throw new Error("Explicit --source-site-id required")
  let state
  try {
    state = await loadState()
  } catch (error) {
    if (error.code !== "ENOENT") throw error
  }
  if (!state) {
    try {
      await access(path.join(root, ".env"))
      throw new Error("Existing environment cannot become an isolated preview")
    } catch (error) {
      if (error.code !== "ENOENT") throw error
    }
    const siteId = randomUUID()
    state = {
      schemaVersion: 1,
      purpose: "upgrade-preview",
      sourceSiteId,
      siteId,
      projectRoot: root,
      siteName: "Upgrade preview",
      email: "preview-owner@smartsite.local",
      databaseName: `smartsite_${siteId.replaceAll("-", "")}`,
      replicaSet: `ss_${siteId.slice(0, 8)}`,
      databasePort: await freePort(),
      appPort: await freePort(),
      stage: "preview-created",
    }
    await atomicJSON(path.join(local, "credentials.json"), {
      databasePassword: randomBytes(24).toString("hex"),
      replicaKey: randomBytes(48).toString("base64"),
      adminPassword: randomBytes(24).toString("base64url"),
      payloadSecret: randomBytes(32).toString("hex"),
      mcpKey: randomBytes(32).toString("hex"),
    })
    await saveState(state)
  }
  if (
    state.purpose !== "upgrade-preview" ||
    state.sourceSiteId !== sourceSiteId ||
    state.projectRoot !== root ||
    state.siteId === sourceSiteId
  )
    throw new Error("Preview ownership/identity mismatch")
  const credentials = await json(path.join(local, "credentials.json"))
  await ensureDatabase(state, credentials)
  if (process.argv.includes("--prepare-database")) {
    await writeFile(
      path.join(local, "restore-target.env"),
      `DATABASE_URL=${databaseURL(state, credentials)}\n`,
      { mode: 0o600 }
    )
    await chmod(path.join(local, "restore-target.env"), 0o600)
    console.log(
      JSON.stringify({
        status: "isolated-preview-database-ready",
        siteId: state.siteId,
        restoreEnvironmentFile: ".smartsite/local/restore-target.env",
      })
    )
  } else {
    const reportArg = process.argv.indexOf("--backup-report")
    if (reportArg < 0) throw new Error("--backup-report required")
    const reportDirectory = path.resolve(process.argv[reportArg + 1])
    const proof = await json(path.join(reportDirectory, "backup-proof.json"))
    if (
      !proof.restored ||
      proof.database.siteId !== sourceSiteId ||
      proof.metadataEncoding !== "canonical-ejson-v2"
    )
      throw new Error(
        "Verified BSON-preserving source backup required; recreate legacy backup proof"
      )
    const backup = path.join(reportDirectory, "backup")
    for (const file of [...proof.files, ...(proof.hostedMedia || [])])
      if (digest(await readFile(safePath(backup, file.path))) !== file.sha256)
        throw new Error("Backup checksum mismatch")
    for (const file of proof.media)
      if (
        digest(await readFile(safePath(path.join(backup, "media"), file.path))) !==
        file.sha256
      )
        throw new Error("Local media checksum mismatch")
    const client = new MongoClient(databaseURL(state, credentials), BSON_READ_OPTIONS)
    await client.connect()
    try {
      const db = client.db()
      if ((await db.listCollections().toArray()).length)
        throw new Error(
          "Preview target is not empty; preserve it and use a fresh preview"
        )
      for (const collection of proof.database.collections) {
        const file = `database/${Buffer.from(collection.name).toString("hex")}.jsonl`
        await db.createCollection(
          collection.name,
          BSON.EJSON.deserialize(await json(safePath(backup, file + ".options.json")), {
            relaxed: false,
          })
        )
        const lines = readline.createInterface({
          input: createReadStream(safePath(backup, file)),
          crlfDelay: Infinity,
        })
        let batch = []
        for await (const line of lines) {
          if (!line) continue
          batch.push(BSON.EJSON.parse(line, { relaxed: false }))
          if (batch.length === 200) {
            await db.collection(collection.name).insertMany(batch)
            batch = []
          }
        }
        if (batch.length) await db.collection(collection.name).insertMany(batch)
        for (const index of BSON.EJSON.deserialize(
          await json(safePath(backup, file + ".indexes.json")),
          { relaxed: false }
        )) {
          if (index.name === "_id_") continue
          const { key, v, ns, ...options } = index
          await db.collection(collection.name).createIndex(key, options)
        }
      }
      if (
        compareSnapshots(proof.database, await snapshotDatabase(db, BSON, sourceSiteId))
          .length
      )
        throw new Error("Preview restoration differs from backup")
      // These deliberate preview-only changes happen before the upgrade baseline.
      await db
        .collection("smartsite-identities")
        .updateOne(
          { siteId: sourceSiteId },
          { $set: { siteId: state.siteId, environment: "local" } }
        )
      await db.collection("users").updateMany(
        {},
        {
          $unset: {
            hash: "",
            salt: "",
            apiKey: "",
            resetPasswordToken: "",
            resetPasswordExpiration: "",
          },
          $set: { enableAPIKey: false, sessions: [] },
        }
      )
      for (const name of [
        "payload-mcp-api-keys",
        "smartsite-operations",
        "smartsite-uploads",
        "payload-locked-documents",
      ])
        await db.collection(name).deleteMany({})
      await db
        .collection("globals")
        .updateMany({ globalType: "settings" }, { $set: { integrations: {} } })
      await atomicJSON(path.join(local, "preview-restoration.json"), {
        sourceSiteId,
        previewSiteId: state.siteId,
        backupFingerprint: proof.fingerprint,
        restoredAt: new Date().toISOString(),
        intentionalChanges: [
          "distinct local identity/secrets",
          "copied user authentication disabled; author IDs retained",
          "copied MCP keys and operation receipts cleared",
          "live integration scripts disabled",
          "media copied into isolated local storage",
          "outbound email disabled by local environment",
        ],
      })
    } finally {
      await client.close()
    }
    await mkdir(path.join(root, "public/media"), { recursive: true })
    for (const file of proof.media) {
      const dest = safePath(path.join(root, "public/media"), file.path)
      await mkdir(path.dirname(dest), { recursive: true })
      await copyFile(safePath(path.join(backup, "media"), file.path), dest)
    }
    const copied = new Map()
    for (const file of proof.hostedMedia || []) {
      if (!file.records?.length)
        throw new Error("Hosted media backup lacks document/filename correspondence")
      for (const record of file.records) {
        if (copied.has(record.filename) && copied.get(record.filename) !== file.sha256)
          throw new Error(
            "Duplicate local media filename requires explicit reconciliation"
          )
        copied.set(record.filename, file.sha256)
        const dest = safePath(path.join(root, "public/media"), record.filename)
        await mkdir(path.dirname(dest), { recursive: true })
        await copyFile(safePath(backup, file.path), dest)
      }
    }
    const values = {
      DATABASE_PROVIDER: "mongoose",
      DATABASE_URL: databaseURL(state, credentials),
      PAYLOAD_SECRET: credentials.payloadSecret,
      CRON_SECRET: randomBytes(32).toString("hex"),
      SMARTSITE_SITE_ID: state.siteId,
      SMARTSITE_ENVIRONMENT: "local",
      NEXT_PUBLIC_URL: `http://127.0.0.1:${state.appPort}`,
      PREVIEW_SECRET: randomBytes(24).toString("hex"),
    }
    await writeFile(
      path.join(root, ".env"),
      Object.entries(values)
        .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
        .join("\n") + "\n",
      { flag: "wx", mode: 0o600 }
    )
    await runNode(
      ["--import", "tsx", "scripts/upgrades/preview-provision.ts"],
      await environment(state),
      path.join(local, "preview-provision.log")
    )
    state.stage = "preview-restored"
    await saveState(state)
    console.log(
      JSON.stringify({
        status: state.stage,
        siteId: state.siteId,
        mediaFiles: proof.media.length + copied.size,
        next: "Record this preview baseline before upgrading; use local:start, never bootstrap, for this restored site.",
      })
    )
  }
} finally {
  await unlock()
}
