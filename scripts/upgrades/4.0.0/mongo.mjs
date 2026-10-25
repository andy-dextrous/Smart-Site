import { createRequire } from "node:module"
import path from "node:path"
import { digest } from "./common.mjs"
import { scheduledJobSummary } from "./scheduled-publishing.mjs"
// Canonical EJSON cannot recover types that the driver has already promoted.
export const BSON_READ_OPTIONS = Object.freeze({
  promoteValues: false,
  promoteLongs: false,
  bsonRegExp: true,
})

/** Refuse BSON that cannot round-trip through the actual backup format. */
export function decodeBackupDocument(BSON, raw, label) {
  try {
    const doc = BSON.deserialize(raw, BSON_READ_OPTIONS)
    const encoded = BSON.EJSON.stringify(doc, { relaxed: false })
    const restored = BSON.EJSON.parse(encoded, { relaxed: false })
    if (!Buffer.from(BSON.serialize(restored)).equals(raw))
      throw new Error("BSON changed")
    return doc
  } catch (cause) {
    throw new Error(
      `BSON in ${label} requires a manual backup procedure; canonical EJSON cannot preserve it exactly`,
      { cause }
    )
  }
}

export async function readCollectionMetadata(db, BSON) {
  return (
    await db.listCollections({}, { ...BSON_READ_OPTIONS, raw: true }).toArray()
  ).map(raw => decodeBackupDocument(BSON, raw, "collection metadata"))
}
export async function readIndexes(db, BSON, name) {
  return (
    await db
      .collection(name)
      .listIndexes({ ...BSON_READ_OPTIONS, raw: true })
      .toArray()
  ).map(raw => decodeBackupDocument(BSON, raw, `indexes for ${name}`))
}
export async function* readBackupDocuments(db, BSON, name) {
  for await (const raw of db
    .collection(name)
    .find({}, { ...BSON_READ_OPTIONS, raw: true })
    .sort({ _id: 1 }))
    yield decodeBackupDocument(BSON, raw, name)
}

export async function connect(context, url = context.env.DATABASE_URL) {
  const require = createRequire(path.join(context.request.siteRoot, "package.json"))
  const { MongoClient, BSON } = require("mongodb")
  const client = new MongoClient(url, {
    serverSelectionTimeoutMS: 10000,
    ...BSON_READ_OPTIONS,
  })
  await client.connect()
  return { client, db: client.db(), BSON }
}
export function stable(value) {
  if (Array.isArray(value)) return value.map(stable)
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map(key => [key, stable(value[key])])
    )
  return value
}
export async function snapshotDatabase(db, BSON, expectedSiteId, ignore = []) {
  const identities = await db
    .collection("smartsite-identities")
    .find({}, BSON_READ_OPTIONS)
    .toArray()
  if (identities.length !== 1 || identities[0].siteId !== expectedSiteId)
    throw new Error("Stored database identity does not match the requested site")
  const collections = []
  const scheduledPublishing = []
  const metadata = await readCollectionMetadata(db, BSON)
  const names = metadata
    .map(c => c.name)
    .filter(name => !name.startsWith("system.") && !ignore.includes(name))
    .sort()
  for (const name of names) {
    const documents = []
    for await (const doc of readBackupDocuments(db, BSON, name)) {
      if (name === "payload-jobs") {
        const job = scheduledJobSummary(doc)
        if (job) scheduledPublishing.push(job)
      }
      documents.push({
        id: BSON.EJSON.stringify(doc._id, { relaxed: false }),
        hash: digest(
          JSON.stringify(stable(BSON.EJSON.serialize(doc, { relaxed: false })))
        ),
      })
    }
    const info = metadata.find(item => item.name === name)
    if (info.type !== "collection" || info.options?.encryptedFields)
      throw new Error(`Collection ${name} requires a manual backup procedure`)
    // Keep typed BSON metadata reversible in JSON reports and backup files.
    const options = BSON.EJSON.serialize(info.options || {}, { relaxed: false })
    const indexes = (await readIndexes(db, BSON, name))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(index =>
        stable(
          BSON.EJSON.serialize(
            { ...index, key: Object.entries(index.key) },
            { relaxed: false }
          )
        )
      )
    collections.push({
      name,
      options,
      indexes,
      metadataHash: digest(JSON.stringify({ options: stable(options), indexes })),
      count: documents.length,
      documents,
      hash: digest(JSON.stringify(documents)),
    })
  }
  return {
    siteId: expectedSiteId,
    environment: identities[0].environment,
    collections,
    scheduledPublishing,
  }
}
export async function databaseSnapshot(context) {
  const { client, db, BSON } = await connect(context)
  try {
    const snapshot = await snapshotDatabase(db, BSON, context.request.expectedSiteId)
    if (snapshot.environment !== context.env.SMARTSITE_ENVIRONMENT)
      throw new Error("Stored environment differs from requested environment")
    return snapshot
  } finally {
    await client.close()
  }
}
export function compareSnapshots(before, after, ignored = new Set()) {
  const differences = []
  if (before.siteId !== after.siteId || before.environment !== after.environment)
    differences.push("site-identity")
  const old = new Map(before.collections.map(c => [c.name, c]))
  const next = new Map(after.collections.map(c => [c.name, c]))
  for (const [name, collection] of old)
    if (
      !ignored.has(name) &&
      (collection.hash !== next.get(name)?.hash ||
        collection.metadataHash !== next.get(name)?.metadataHash)
    )
      differences.push(name)
  for (const [name, collection] of next)
    if (!old.has(name) && !ignored.has(name) && collection.count) differences.push(name)
  return differences
}

export async function compareUpgradeDatabase(context, before) {
  const { client, db, BSON } = await connect(context)
  try {
    const receipt = await db
      .collection("site-upgrade-receipts")
      .findOne({ release: "4.0.0" })
    if (receipt && receipt.fingerprint !== context.fingerprint)
      throw new Error("Stored upgrade receipt belongs to a different request")
    if (receipt?.convertedJobs?.length) {
      const work = await db
        .collection("site-publication-work")
        .findOne({ _id: new BSON.ObjectId(receipt.workId) })
      if (
        !work ||
        work.source !== "upgrade/4.0.0/legacy-jobs" ||
        work.kind !== "routes" ||
        !["pending", "running", "completed", "failed"].includes(work.status) ||
        receipt.convertedJobs.some(job => job.workId !== receipt.workId)
      )
        throw new Error("Converted jobs lost their durable publication work")
    }
    const after = await snapshotDatabase(db, BSON, context.request.expectedSiteId)
    const ignored = new Set(["site-upgrade-receipts", "site-publication-work"])
    if (receipt?.convertedJobs?.length) {
      // Prove only the named conversion fields changed; preserve input/history/IDs.
      const { readFile } = await import("node:fs/promises")
      const filename = path.join(
        context.request.reportDirectory,
        "backup/database",
        Buffer.from("payload-jobs").toString("hex") + ".jsonl"
      )
      const originals = (await readFile(filename, "utf8"))
        .trim()
        .split("\n")
        .filter(Boolean)
        .map(line => BSON.EJSON.parse(line, { relaxed: false }))
      const converted = new Set(receipt.convertedJobs.map(item => String(item.id)))
      const jobs = await db
        .collection("payload-jobs")
        .find({}, BSON_READ_OPTIONS)
        .toArray()
      if (originals.length !== jobs.length) throw new Error("Legacy job count changed")
      const strip = doc =>
        Object.fromEntries(
          Object.entries(doc).filter(
            ([key]) =>
              !["completedAt", "processing", "hasError", "updatedAt"].includes(key)
          )
        )
      for (const original of originals) {
        const actual = jobs.find(job => String(job._id) === String(original._id))
        if (!actual) throw new Error("Legacy job was lost")
        const simplify = converted.has(String(original._id)) ? strip : value => value
        if (
          JSON.stringify(
            stable(BSON.EJSON.serialize(simplify(original), { relaxed: false }))
          ) !==
          JSON.stringify(
            stable(BSON.EJSON.serialize(simplify(actual), { relaxed: false }))
          )
        )
          throw new Error(`Legacy job input/history changed: ${original._id}`)
        if (
          converted.has(String(original._id)) &&
          (!actual.completedAt || actual.processing || actual.hasError)
        )
          throw new Error("Legacy job conversion is incomplete")
      }
      ignored.add("payload-jobs")
    }
    return { differences: compareSnapshots(before, after, ignored), after, receipt }
  } finally {
    await client.close()
  }
}
