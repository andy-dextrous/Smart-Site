import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { MongoClient, ObjectId } from "mongodb"
import { createLocalReq, getPayload } from "payload"
import config from "../../src/payload.config"
import { queuePublication } from "../../src/lib/publication/intent"
import {
  claimPublication,
  drainPublication,
  processPublicationBatch,
} from "../../src/lib/publication/runner"
const payload = await getPayload({ config })
const mongo = new MongoClient(process.env.DATABASE_URL!)
await mongo.connect()
try {
  await drainPublication(payload, async () => {}, 60000)
  const rows = Array.from({ length: 10 }, (_, i) => ({
    _id: new ObjectId(),
    title: `Independent midbatch ${i}`,
    slug: `independent-midbatch-${i}`,
    uri: `/before-independent-midbatch-${i}`,
    sections: [],
    _status: "published",
    createdAt: new Date(),
    updatedAt: new Date(),
  }))
  await mongo.db().collection("pages").insertMany(rows)
  const ids = rows.map(row => String(row._id))
  const workID = await queuePublication(
    await createLocalReq({}, payload),
    "routes",
    "independent-midbatch-kill"
  )
  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ["--import", "tsx", "tests/routing/independent-midbatch-child.ts"],
      {
        env: {
          ...process.env,
          REVIEW_PUBLICATION_IDS: JSON.stringify(ids),
          REVIEW_PUBLICATION_WORK: workID!,
        },
        stdio: ["ignore", "pipe", "pipe"],
      }
    )
    let output = "",
      killed = false,
      error = ""
    const timeout = setTimeout(() => {
      child.kill("SIGKILL")
      reject(new Error(`Independent child timed out: ${error.slice(-1000)}`))
    }, 30000)
    child.stderr.on("data", chunk => {
      error += chunk
    })
    child.stdout.on("data", chunk => {
      output += chunk
      if (output.includes("INDEPENDENT_MIDBATCH_WRITES_UNCOMMITTED")) {
        killed = true
        child.kill("SIGKILL")
      }
    })
    child.once("error", reject)
    child.once("exit", () => {
      clearTimeout(timeout)
      killed
        ? resolve()
        : reject(
            new Error(
              `Child exited before midbatch: ${error.slice(-1000)} ${output.slice(-1000)}`
            )
          )
    })
  })
  const current = await mongo
    .db()
    .collection("pages")
    .find({ _id: { $in: rows.map(row => row._id) } })
    .toArray()
  for (const row of rows)
    assert.equal(
      current.find(doc => String(doc._id) === String(row._id))!.uri,
      row.uri,
      "Uncommitted derived change escaped a killed transaction"
    )
  assert.equal(
    await mongo
      .db()
      .collection("uri-indexes")
      .countDocuments({ documentId: { $in: ids } }),
    0,
    "Uncommitted URI index escaped"
  )
  const abandoned = (await payload.findByID({
    collection: "site-publication-work" as any,
    id: workID!,
    overrideAccess: true,
  })) as any
  assert.equal(abandoned.processed, 0)
  assert.equal(abandoned.status, "running")
  // Real lease expiry, not a test database rewrite of the deadline.
  await new Promise(resolve =>
    setTimeout(resolve, Math.max(0, Date.parse(abandoned.leaseUntil) - Date.now()) + 100)
  )
  const claimWaits: number[] = []
  let owned = null,
    misses = 0
  const recoveryStart = Date.now(),
    recoveryDeadline = Date.now() + 160000
  while (!owned && Date.now() < recoveryDeadline) {
    const claimStart = Date.now()
    owned = await claimPublication(payload, 500)
    const elapsed = Date.now() - claimStart
    claimWaits.push(elapsed)
    assert.ok(elapsed < 2500, `Claim ignored its database wait budget: ${elapsed}ms`)
    if (!owned) {
      misses++
      const pending = (await payload.findByID({
        collection: "site-publication-work" as any,
        id: workID!,
        overrideAccess: true,
      })) as any
      assert.equal(
        pending.generation,
        abandoned.generation,
        "Timed-out claim mutated the ownership generation"
      )
      assert.equal(pending.owner, abandoned.owner)
      assert.equal(pending.processed, 0)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  assert.ok(
    owned,
    "Mongo transaction cleanup did not release claim within recovery window"
  )
  assert.ok(misses > 0, "The probe did not exercise a timed-out claim")
  assert.ok(Date.parse(owned.leaseUntil) > Date.now(), "Claim returned an expired lease")
  assert.equal(owned.id, workID)
  assert.equal(owned.generation, abandoned.generation + 1)
  while (!owned.checkpoint?.cache) owned = await processPublicationBatch(payload, owned)
  await payload.db.updateOne({
    collection: "site-publication-work" as any,
    where: { id: { equals: workID } },
    data: { status: "pending", owner: null, leaseUntil: null },
    returning: true,
  })
  await drainPublication(payload, async () => {}, 60000)
  const indexes = await mongo
    .db()
    .collection("uri-indexes")
    .find({ documentId: { $in: ids } })
    .toArray()
  assert.equal(indexes.length, 10)
  for (const row of rows)
    assert.equal(
      indexes.find(doc => doc.documentId === String(row._id))!.uri,
      `/${row.slug}`
    )
  const redirects = await mongo
    .db()
    .collection("redirects")
    .find({ from: { $in: rows.map(row => row.uri) } })
    .toArray()
  assert.equal(redirects.length, 10)
  await drainPublication(payload, async () => {}, 1000)
  assert.equal(
    await mongo
      .db()
      .collection("redirects")
      .countDocuments({ from: { $in: rows.map(row => row.uri) } }),
    10
  )
  console.log(
    JSON.stringify({
      boundedClaimMisses: misses,
      maxClaimMilliseconds: Math.max(...claimWaits),
      recoveryMilliseconds: Date.now() - recoveryStart,
      independentPassed: [
        "SIGKILL-inside-live-Mongo-transaction",
        "no-derived-content-or-index-before-commit",
        "real-expired-lease-takeover",
        "abandoned-transaction-lock-claim-is-bounded",
        "timed-out-claim-does-not-mutate-ownership",
        "midbatch-replay-exactly-one-index-and-redirect-per-document",
      ],
    })
  )
} finally {
  await mongo.close()
  await payload.destroy()
}
