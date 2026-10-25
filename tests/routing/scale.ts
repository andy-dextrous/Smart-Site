import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { MongoClient, ObjectId } from "mongodb"
import { createLocalReq, getPayload } from "payload"
import config from "../../src/payload.config"
import { queuePublication } from "../../src/website/publication/intent"
import { drainPublication } from "../../src/website/publication/runner"

const payload = await getPayload({ config })
const mongo = new MongoClient(process.env.DATABASE_URL!)
await mongo.connect()
try {
  await drainPublication(payload, async () => {}, 60_000)
  const docs = Array.from({ length: 1205 }, (_, i) => ({
    _id: new ObjectId(),
    title: `Scale ${i}`,
    slug: `scale-${i}`,
    uri: `/stale-scale-${i}`,
    sections: [],
    _status: "published",
    createdAt: new Date(),
    updatedAt: new Date(),
  }))
  await mongo.db().collection("pages").insertMany(docs)
  const req = await createLocalReq({}, payload)
  const id = await queuePublication(req, "routes", "scale-1205-killed-runner")
  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ["--import", "tsx", "tests/routing/interrupt.ts"],
      {
        env: { ...process.env, DISABLE_PAYLOAD_HMR: "true" },
        stdio: ["ignore", "pipe", "pipe"],
      }
    )
    let output = "",
      killed = false
    const timer = setTimeout(() => {
      child.kill("SIGKILL")
      reject(new Error("Interrupted-worker checkpoint timed out"))
    }, 30_000)
    child.stdout.on("data", chunk => {
      output += chunk
      if (output.includes(`CHECKPOINT_COMMITTED:${id}`)) {
        killed = true
        child.kill("SIGKILL")
      }
    })
    child.once("error", reject)
    child.once("exit", () => {
      clearTimeout(timer)
      killed ? resolve() : reject(new Error("Worker exited before checkpoint"))
    })
  })
  const running = (await payload.findByID({
    collection: "site-publication-work" as any,
    id: id!,
    overrideAccess: true,
  })) as any
  assert.equal(running.status, "running")
  assert.ok(running.processed > 0)
  await payload.db.updateOne({
    collection: "site-publication-work" as any,
    where: { id: { equals: id } },
    data: { leaseUntil: new Date(Date.now() - 1000).toISOString() },
    returning: true,
  })
  const started = Date.now()
  await drainPublication(payload, async () => {}, 120_000)
  const finished = (await payload.findByID({
    collection: "site-publication-work" as any,
    id: id!,
    overrideAccess: true,
  })) as any
  assert.equal(finished.status, "completed")
  assert.ok(finished.attempts >= 1)
  const indexes = await mongo
    .db()
    .collection("uri-indexes")
    .find({ documentId: { $in: docs.map(doc => String(doc._id)) } })
    .toArray()
  assert.equal(indexes.length, 1205)
  const byId = new Map(indexes.map(entry => [String(entry.documentId), entry]))
  const stored = await mongo
    .db()
    .collection("pages")
    .find({ _id: { $in: docs.map(doc => doc._id) } })
    .toArray()
  for (const doc of docs) {
    const index = byId.get(String(doc._id))!
    assert.equal(index.uri, `/${doc.slug}`)
    assert.equal(index.status, "published")
    assert.equal(index.breadcrumbs.at(-1)?.uri, `/${doc.slug}`)
    const current = stored.find(row => String(row._id) === String(doc._id))!
    assert.equal(current.title, doc.title)
    assert.equal(current.updatedAt.toISOString(), doc.updatedAt.toISOString())
  }
  console.log(
    JSON.stringify({
      passed: [
        "actual-worker-1205-every-uri-and-breadcrumb",
        "process-killed-after-checkpoint",
        "abandoned-worker-resume",
        "source-timestamps-preserved",
      ],
      records: docs.length,
      resumeMilliseconds: Date.now() - started,
    })
  )
} finally {
  await mongo.close()
  await payload.destroy()
}
