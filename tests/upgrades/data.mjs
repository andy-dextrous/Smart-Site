import assert from "node:assert/strict"
import { readFile, writeFile, access } from "node:fs/promises"
import path from "node:path"
import { createRequire } from "node:module"
import { pathToFileURL } from "node:url"
const root = process.cwd(),
  require = createRequire(path.join(root, "package.json"))
Object.assign(process.env, require("dotenv").parse(await readFile(".env")), {
  DISABLE_PAYLOAD_HMR: "true",
  NODE_ENV: "production",
})
const { MongoClient, BSON } = require("mongodb")
let configPath = path.join(root, "src/payload.config.ts")
try {
  await access(configPath)
} catch {
  configPath = path.join(root, "src/admin/payload/payload.config.ts")
}
const { getPayload } = await import(pathToFileURL(require.resolve("payload")).href)
const config = await (await import(pathToFileURL(configPath).href)).default
config.onInit = undefined
config.jobs = { ...config.jobs, autoRun: [] }
const payload = await getPayload({ config })
await Promise.all(Object.values(payload.db.collections ?? {}).map(model => model.init()))
const mongo = new MongoClient(process.env.DATABASE_URL)
await mongo.connect()
const db = mongo.db()
const phase = process.argv[2],
  evidence = process.argv[3],
  customized = process.argv.includes("--custom")
try {
  if (phase === "populate") {
    const preliminary = JSON.parse(await readFile(evidence))
    const page = { id: preliminary.pageId },
      child = { id: preliminary.childId }
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a4m8AAAAASUVORK5CYII=",
      "base64"
    )
    const media = await payload.create({
      collection: "media",
      context: { preventHooks: true },
      data: { alt: "Preserve original media" },
      file: {
        data: png,
        mimetype: "image/png",
        name: "upgrade-original.png",
        size: png.length,
      },
    })
    await db.createCollection("client-audit", {
      validator: {
        $and: [
          { kind: { $type: "string" } },
          { kind: { $regex: /^fixture$/i } },
          { born: { $gte: new Date("2020-01-01T00:00:00Z") } },
          { doubleOne: { $type: "double", $gte: new BSON.Double(1) } },
          { longOne: { $type: "long", $gte: BSON.Long.fromNumber(1) } },
          { intOne: { $type: "int" } },
          { decimal: { $type: "decimal" } },
        ],
      },
      validationLevel: "strict",
    })
    await db.collection("client-audit").createIndex(
      { z: 1, a: -1 },
      {
        name: "ordered_client_index",
        partialFilterExpression: { born: { $gte: new Date("2020-01-01T00:00:00Z") } },
      }
    )
    await db.collection("client-audit").insertOne({
      kind: "fixture",
      born: new Date("2024-01-01T00:00:00Z"),
      z: 2,
      a: 1,
      nested: { arrays: [["a", 2], { values: [1, 2, 3] }] },
      doubleOne: new BSON.Double(1),
      longOne: BSON.Long.fromNumber(1),
      intOne: new BSON.Int32(1),
      negativeZero: new BSON.Double(-0),
      largeLong: BSON.Long.fromString("9223372036854775806"),
      decimal: BSON.Decimal128.fromString("123.4500"),
      binary: new BSON.Binary(Buffer.from([0, 255, 16]), 128),
      timestamp: BSON.Timestamp.fromBits(8, 9),
      specialRegex: new BSON.BSONRegExp("^ fixture $", "ix"),
      typedArray: [new BSON.Double(1), BSON.Long.fromNumber(1), new BSON.Int32(1)],
    })
    const jobs = [],
      regularJobs = customized ? 31 : 1,
      legacyJobs = regularJobs + 1
    for (let i = 0; i < regularJobs; i++)
      await payload.jobs.queue({
        task: "dependent-uri-updates",
        input: {
          operations: [
            { operation: "template-content-change", entityId: String(page.id) },
          ],
          requestId: `upgrade-${i}`,
          batchedAt: new Date().toISOString(),
        },
      })
    jobs.push({
      taskSlug: "dependent-uri-updates",
      input: {
        operations: [],
        requestId: "sparse-historical",
        batchedAt: new Date().toISOString(),
      },
      totalTried: 0,
      hasError: false,
      processing: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    jobs.push({
      taskSlug: "client-unrelated-task",
      input: { keep: ["unrelated", 42] },
      totalTried: 0,
      hasError: false,
      processing: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    const operator = await db.collection("users").findOne({})
    for (const [type, waitUntil] of [
      ["publish", new Date(Date.now() - 86400000)],
      ["unpublish", new Date(Date.now() + 86400000)],
    ])
      jobs.push({
        taskSlug: "schedulePublish",
        input: {
          type,
          doc: { relationTo: "pages", value: String(child.id) },
          user: { relationTo: "users", value: String(operator._id) },
        },
        queue: "default",
        waitUntil,
        processing: false,
        hasError: false,
        totalTried: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    await db.collection("payload-jobs").insertMany(jobs)
    const nativeJobBytes = (
      await db
        .collection("payload-jobs")
        .find({ taskSlug: "schedulePublish" }, { raw: true })
        .sort({ _id: 1 })
        .toArray()
    ).map(bytes => bytes.toString("base64"))
    if (customized)
      await db
        .collection("pages")
        .updateOne(
          { _id: new (require("mongodb").ObjectId)(page.id) },
          { $set: { clientNote: "Keep this customized field" } }
        )
    const identity = await db.collection("smartsite-identities").findOne({})
    const keys = await db.collection("payload-mcp-api-keys").find({}).toArray()
    await writeFile(
      evidence,
      JSON.stringify(
        {
          pageId: page.id,
          childId: child.id,
          mediaId: media.id,
          siteId: identity.siteId,
          keyIds: keys.map(x => String(x._id)),
          legacyJobs,
          nativeJobBytes,
        },
        null,
        2
      )
    )
    console.log(JSON.stringify({ phase, siteId: identity.siteId, legacyJobs }))
  } else {
    const e = JSON.parse(await readFile(evidence))
    assert.deepEqual(
      (
        await db
          .collection("payload-jobs")
          .find({ taskSlug: "schedulePublish" }, { raw: true })
          .sort({ _id: 1 })
          .toArray()
      ).map(bytes => bytes.toString("base64")),
      e.nativeJobBytes,
      "Existing future and overdue native jobs must retain every BSON byte without autoplay"
    )
    assert.equal(
      (await db.collection("smartsite-identities").findOne({})).siteId,
      e.siteId
    )
    assert.deepEqual(
      (await db.collection("payload-mcp-api-keys").find({}).toArray()).map(x =>
        String(x._id)
      ),
      e.keyIds
    )
    const published = await payload.findByID({
      collection: "pages",
      id: e.childId,
      draft: false,
      depth: 0,
    })
    const draft = await payload.findByID({
      collection: "pages",
      id: e.childId,
      draft: true,
      depth: 0,
    })
    assert.equal(published.title, "Preserved child")
    assert.equal(draft.title, "Private unpublished title")
    assert.deepEqual((await db.collection("client-audit").findOne({})).nested.arrays, [
      ["a", 2],
      { values: [1, 2, 3] },
    ])
    const typedFields = [
      "doubleOne",
      "longOne",
      "intOne",
      "negativeZero",
      "largeLong",
      "decimal",
      "binary",
      "timestamp",
      "specialRegex",
    ]
    const projection = Object.fromEntries(
      typedFields.map(field => [field, { $type: `$${field}` }])
    )
    projection._id = 0
    projection.typedArray = {
      $map: { input: "$typedArray", as: "value", in: { $type: "$$value" } },
    }
    assert.deepEqual(
      await db
        .collection("client-audit")
        .aggregate([{ $project: projection }])
        .next(),
      {
        doubleOne: "double",
        longOne: "long",
        intOne: "int",
        negativeZero: "double",
        largeLong: "long",
        decimal: "decimal",
        binary: "binData",
        timestamp: "timestamp",
        specialRegex: "regex",
        typedArray: ["double", "long", "int"],
      }
    )
    const typed = await db
      .collection("client-audit")
      .findOne({}, { promoteValues: false, promoteLongs: false, bsonRegExp: true })
    assert.ok(Object.is(typed.negativeZero.value, -0))
    assert.equal(typed.largeLong.toString(), "9223372036854775806")
    assert.equal(typed.decimal.toString(), "123.4500")
    assert.equal(typed.binary.sub_type, 128)
    assert.equal(typed.specialRegex.options, "ix")
    const metadata = await db.listCollections({ name: "client-audit" }).next()
    assert.equal(
      metadata.options.validator.$and[2].born.$gte.toISOString(),
      "2020-01-01T00:00:00.000Z"
    )
    assert.equal(
      require("mongodb").BSON.EJSON.stringify(
        metadata.options.validator.$and[1].kind.$regex
      ),
      require("mongodb").BSON.EJSON.stringify(/^fixture$/i)
    )
    const orderedIndex = (await db.collection("client-audit").indexes()).find(
      index => index.name === "ordered_client_index"
    )
    assert.deepEqual(Object.entries(orderedIndex.key), [
      ["z", 1],
      ["a", -1],
    ])
    assert.equal(
      orderedIndex.partialFilterExpression.born.$gte.toISOString(),
      "2020-01-01T00:00:00.000Z"
    )
    if (customized) {
      assert.equal(
        (await payload.findByID({ collection: "pages", id: e.pageId, depth: 0 }))
          .clientNote,
        "Keep this customized field"
      )
      assert.match(
        await readFile("src/client-feature.ts", "utf8"),
        /preserve-client-feature/
      )
    }
    assert.equal(
      await db.collection("payload-jobs").countDocuments({
        taskSlug: "client-unrelated-task",
        completedAt: { $exists: false },
      }),
      1
    )
    if (phase === "check-new")
      assert.equal(
        await db.collection("payload-jobs").countDocuments({
          taskSlug: "dependent-uri-updates",
          completedAt: { $exists: true },
        }),
        e.legacyJobs
      )
    if (phase === "check-rollback") {
      const check = await payload.create({
        collection: "pages",
        context: { preventHooks: true },
        data: {
          title: "Rollback write works",
          slug: "rollback-check",
          _status: "draft",
          sections: [],
        },
      })
      assert.equal(
        (await payload.findByID({ collection: "pages", id: check.id, draft: true }))
          .title,
        "Rollback write works"
      )
    }
    console.log(JSON.stringify({ phase, status: "passed", siteId: e.siteId }))
  }
} finally {
  await mongo.close()
  await payload.destroy()
}
