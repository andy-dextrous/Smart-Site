import { validateBackup } from "../../scripts/upgrades/4.0.0/common.mjs"
// Real Mongo backup-format regression. Owns only a private temporary mongod process.
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { createServer } from "node:net"
import { mkdtemp, mkdir, open, writeFile, readFile } from "node:fs/promises"
import path from "node:path"
import os from "node:os"
import { fileURLToPath } from "node:url"
import { MongoClient, BSON } from "mongodb"
import {
  connect,
  snapshotDatabase,
  compareSnapshots,
  readBackupDocuments,
  readCollectionMetadata,
  readIndexes,
  decodeBackupDocument,
  BSON_READ_OPTIONS,
} from "../../scripts/upgrades/4.0.0/mongo.mjs"
const root = fileURLToPath(new URL("../../", import.meta.url))
const lane = await mkdtemp(path.join(os.tmpdir(), "smartsite-bson-fidelity-"))
await mkdir(path.join(lane, "mongo"), { mode: 0o700 })
const socket = createServer()
await new Promise(resolve => socket.listen(0, "127.0.0.1", resolve))
const port = socket.address().port
await new Promise(resolve => socket.close(resolve))
const log = await open(path.join(lane, "mongo.log"), "w", 0o600)
const processMongo = spawn(
  "mongod",
  [
    "--dbpath",
    path.join(lane, "mongo"),
    "--bind_ip",
    "127.0.0.1",
    "--port",
    String(port),
    "--quiet",
  ],
  { stdio: ["ignore", log.fd, log.fd] }
)
await new Promise((resolve, reject) => {
  processMongo.once("spawn", resolve)
  processMongo.once("error", reject)
})
let source, restored, seed
try {
  const url = `mongodb://127.0.0.1:${port}/bson_source`
  seed = new MongoClient(url, { serverSelectionTimeoutMS: 300 })
  const deadline = Date.now() + 15000
  while (true) {
    try {
      await seed.connect()
      break
    } catch (error) {
      if (Date.now() >= deadline || processMongo.exitCode !== null) throw error
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  const context = { request: { siteRoot: root }, env: { DATABASE_URL: url } }
  source = await connect(context)
  restored = await connect(context, `mongodb://127.0.0.1:${port}/bson_restored`)
  await source.db
    .collection("smartsite-identities")
    .insertOne({ siteId: "bson-fixture", environment: "local" })
  await source.db.createCollection("typed", {
    validator: {
      $and: [
        { doubleOne: { $type: "double", $gte: new BSON.Double(1) } },
        { longOne: { $type: "long", $gte: BSON.Long.fromNumber(1) } },
        { intOne: { $type: "int" } },
        { decimal: { $type: "decimal" } },
        { name: { $regex: new BSON.BSONRegExp("^ fixture $", "ix") } },
      ],
    },
    validationLevel: "strict",
  })
  await source.db.collection("typed").createIndex(
    { z: 1, a: -1 },
    {
      name: "ordered_typed_index",
      partialFilterExpression: { doubleOne: { $gte: new BSON.Double(1) } },
    }
  )
  await source.db.collection("typed").insertOne({
    _id: "typed",
    name: "fixture",
    doubleOne: new BSON.Double(1),
    longOne: BSON.Long.fromNumber(1),
    intOne: new BSON.Int32(1),
    negativeZero: new BSON.Double(-0),
    largeLong: BSON.Long.fromString("9223372036854775806"),
    decimal: BSON.Decimal128.fromString("123.4500"),
    binary: new BSON.Binary(Buffer.from([0, 255, 16]), 128),
    timestamp: BSON.Timestamp.fromBits(8, 9),
    regex: new BSON.BSONRegExp("^ fixture $", "ix"),
    nested: [
      new BSON.Double(1),
      BSON.Long.fromNumber(1),
      new BSON.Int32(1),
      [new BSON.Double(-0), BSON.Long.fromString("9223372036854775806")],
    ],
    z: new BSON.Int32(2),
    a: new BSON.Int32(1),
  })
  await assert.rejects(
    validateBackup(
      { fingerprint: "fixture" },
      { fingerprint: "fixture", restored: true, metadataEncoding: "canonical-ejson-v1" }
    ),
    /BSON-preserving restored backup required/
  )
  const before = await snapshotDatabase(source.db, BSON, "bson-fixture")
  // Same document readers and canonical EJSON format as backup.mjs; restore the
  // actual on-disk bytes, then ask Mongo itself for BSON types (not normalized hashes).
  for (const info of await readCollectionMetadata(source.db, BSON)) {
    const filename = path.join(lane, info.name + ".jsonl")
    const lines = []
    for await (const doc of readBackupDocuments(source.db, BSON, info.name))
      lines.push(BSON.EJSON.stringify(doc, { relaxed: false }))
    await writeFile(filename, lines.join("\n") + "\n", { mode: 0o600 })
    const optionsFile = path.join(lane, info.name + ".options.json")
    await writeFile(optionsFile, BSON.EJSON.stringify(info.options, { relaxed: false }), {
      mode: 0o600,
    })
    await restored.db.createCollection(
      info.name,
      BSON.EJSON.parse(await readFile(optionsFile, "utf8"), { relaxed: false })
    )
    for (const line of (await readFile(filename, "utf8"))
      .trim()
      .split("\n")
      .filter(Boolean))
      await restored.db
        .collection(info.name)
        .insertOne(BSON.EJSON.parse(line, { relaxed: false }))
    const indexFile = path.join(lane, info.name + ".indexes.json")
    await writeFile(
      indexFile,
      BSON.EJSON.stringify(await readIndexes(source.db, BSON, info.name), {
        relaxed: false,
      }),
      { mode: 0o600 }
    )
    for (const index of BSON.EJSON.parse(await readFile(indexFile, "utf8"), {
      relaxed: false,
    })) {
      if (index.name === "_id_") continue
      const { key, v, ns, ...options } = index
      await restored.db.collection(info.name).createIndex(key, options)
    }
  }
  const fields = [
    "doubleOne",
    "longOne",
    "intOne",
    "negativeZero",
    "largeLong",
    "decimal",
    "binary",
    "timestamp",
    "regex",
  ]
  const projection = Object.fromEntries(
    fields.map(field => [field, { $type: `$${field}` }])
  )
  projection._id = 0
  projection.nested = {
    $map: { input: { $slice: ["$nested", 3] }, as: "value", in: { $type: "$$value" } },
  }
  const types = await restored.db
    .collection("typed")
    .aggregate([{ $project: projection }])
    .next()
  assert.deepEqual(types, {
    doubleOne: "double",
    longOne: "long",
    intOne: "int",
    negativeZero: "double",
    largeLong: "long",
    decimal: "decimal",
    binary: "binData",
    timestamp: "timestamp",
    regex: "regex",
    nested: ["double", "long", "int"],
  })
  const original = await source.db
    .collection("typed")
    .findOne({}, { ...BSON_READ_OPTIONS, raw: true })
  const copy = await restored.db
    .collection("typed")
    .findOne({}, { ...BSON_READ_OPTIONS, raw: true })
  assert.deepEqual(
    copy,
    original,
    "Raw BSON bytes changed across on-disk EJSON backup/restore"
  )
  const restoredDoc = decodeBackupDocument(BSON, copy, "typed")
  assert.ok(Object.is(restoredDoc.negativeZero.value, -0))
  assert.equal(restoredDoc.regex.options, "ix")
  assert.equal(restoredDoc.binary.sub_type, 128)
  assert.equal(restoredDoc.largeLong.toString(), "9223372036854775806")
  assert.equal(restoredDoc.decimal.toString(), "123.4500")
  assert.deepEqual(
    compareSnapshots(before, await snapshotDatabase(restored.db, BSON, "bson-fixture")),
    []
  )
  const indexes = await readIndexes(restored.db, BSON, "typed")
  assert.deepEqual(
    Object.keys(indexes.find(index => index.name === "ordered_typed_index").key),
    ["z", "a"]
  )
  await restored.db
    .collection("typed")
    .updateOne(
      { _id: "typed" },
      { $set: { doubleOne: new BSON.Int32(1) } },
      { bypassDocumentValidation: true }
    )
  assert.deepEqual(
    compareSnapshots(before, await snapshotDatabase(restored.db, BSON, "bson-fixture")),
    ["typed"],
    "Snapshot accepted a type-only mutation"
  )
  // Deprecated BSON Undefined has no lossless canonical EJSON representation.
  const deprecated = Buffer.concat([
    Buffer.alloc(4),
    Buffer.from([6]),
    Buffer.from("unsupported\0"),
    Buffer.from([0]),
  ])
  deprecated.writeInt32LE(deprecated.length)
  assert.throws(
    () => decodeBackupDocument(BSON, deprecated, "deprecated fixture"),
    /manual backup procedure/
  )
  await writeFile(
    path.join(lane, "result.json"),
    JSON.stringify(
      {
        status: "passed",
        types,
        rawBSON: "identical",
        typeOnlyMutation: "detected",
        unsupportedBSON: "refused",
        metadata: "preserved",
        indexKeyOrder: ["z", "a"],
      },
      null,
      2
    ),
    { mode: 0o600 }
  )
  console.log(
    JSON.stringify({
      status: "passed",
      lane,
      checks: fields.concat([
        "nested-types",
        "raw-byte-equality",
        "metadata",
        "ordered-index",
        "type-only-mutation",
        "unsupported-type-refusal",
      ]),
    })
  )
} finally {
  await source?.client.close()
  await restored?.client.close()
  await seed?.close()
  if (processMongo.exitCode === null) {
    const exited = new Promise(resolve => processMongo.once("exit", resolve))
    processMongo.kill("SIGTERM")
    await exited
  }
  await log.close()
}
