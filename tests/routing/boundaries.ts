import assert from "node:assert/strict"
import { writeFile } from "node:fs/promises"
import { MongoClient } from "mongodb"
import { createLocalReq, getPayload, type Payload } from "payload"
import config from "../../src/payload.config"
import { websiteCollections } from "../../src/website/collection-metadata"
import { queuePublication } from "../../src/website/publication/intent"
import { drainPublication } from "../../src/website/publication/runner"

// This is the publication worker's boundary, not the legacy regeneration helper's.
// Observed real queries below must still use this limit and make the terminal read.
const BATCH_SIZE = 25
const payload = await getPayload({ config })
const mongo = new MongoClient(process.env.DATABASE_URL!)
await mongo.connect()
const db = mongo.db()
const workCollection = "site-publication-work" as any
const inventory = websiteCollections(payload.config).map(item => item.slug)
const rows = (name: string) => db.collection(name).find({}).sort({ _id: 1 }).toArray()
const pages: any[] = []
const cases: unknown[] = []

async function boundary(size: number) {
  const before = await rows("pages")
  const versions = await rows("_pages_versions")
  const previousIndexes = await rows("uri-indexes")
  const req = await createLocalReq({}, payload)
  const id = await queuePublication(req, "routes", `boundary-${size}`)
  const batches: string[][] = []
  const checkpoints: { collection: number; after?: string; processed: number }[] = []
  const originalFind = payload.find
  const originalCommit = payload.db.commitTransaction
  payload.db.commitTransaction = async transactionID => {
    const result = await originalCommit.call(payload.db, transactionID)
    // Observe persisted checkpoints after the real Mongo commit, not an in-memory
    // callback or an uncommitted update. The serving app is not running yet.
    const current: any = await payload.findByID({
      collection: workCollection,
      id: id!,
      overrideAccess: true,
    })
    assert.equal(current.status, "running")
    assert.ok(!current.cacheAcknowledgedAt)
    checkpoints.push({
      collection: current.checkpoint.collection,
      after: current.checkpoint.after,
      processed: current.processed,
    })
    return result
  }
  // Delegate every query to the real Payload/Mongo adapter. Observe, never stub.
  payload.find = (async (options: any) => {
    const result = await originalFind.call(payload, options)
    if (
      options.collection === "pages" &&
      options.req?.context.publicationWorker &&
      options.pagination === false &&
      options.sort === "id"
    ) {
      assert.equal(options.limit, BATCH_SIZE)
      batches.push(result.docs.map((doc: any) => String(doc.id)))
    }
    return result
  }) as Payload["find"]
  let acknowledgments = 0
  try {
    const drained = await drainPublication(
      payload,
      async () => {
        const current: any = await payload.findByID({
          collection: workCollection,
          id: id!,
          overrideAccess: true,
        })
        assert.equal(
          current.status,
          "running",
          "Completion preceded cache acknowledgment"
        )
        assert.equal(current.checkpoint.cache, true)
        assert.equal(current.checkpoint.collection, inventory.length)
        assert.ok(!current.checkpoint.after, "Terminal cursor was not cleared")
        assert.ok(!current.cacheAcknowledgedAt)
        acknowledgments++
      },
      60_000
    )
    assert.equal(drained.completed, 1)
  } finally {
    payload.find = originalFind
    payload.db.commitTransaction = originalCommit
  }
  assert.equal(acknowledgments, 1)
  assert.deepEqual(
    batches.map(batch => batch.length),
    size === BATCH_SIZE ? [BATCH_SIZE, 0] : [size]
  )
  assert.deepEqual(batches.flat(), pages.map(page => String(page.id)).sort())
  const terminalCollections = inventory.map((_, index) => index + 1)
  assert.deepEqual(
    checkpoints.map(item => item.collection),
    size === BATCH_SIZE ? [0, ...terminalCollections] : terminalCollections
  )
  if (size === BATCH_SIZE) assert.equal(checkpoints[0].after, batches[0].at(-1))
  for (const checkpoint of checkpoints) {
    assert.equal(checkpoint.processed, size)
    if (checkpoint.collection > 0) assert.ok(!checkpoint.after)
  }
  const completed: any = await payload.findByID({
    collection: workCollection,
    id: id!,
    overrideAccess: true,
  })
  assert.equal(completed.status, "completed")
  assert.equal(completed.processed, size)
  assert.ok(completed.cacheAcknowledgedAt)
  assert.deepEqual(
    await rows("_pages_versions"),
    versions,
    "Worker rewrote authored versions"
  )
  const indexes = await rows("uri-indexes")
  assert.equal(indexes.length, size)
  for (const previous of previousIndexes)
    assert.equal(
      String(indexes.find(row => row.documentId === previous.documentId)!._id),
      String(previous._id)
    )
  for (const page of await rows("pages")) {
    const original = before.find(row => String(row._id) === String(page._id))!
    const index = indexes.find(row => row.documentId === String(page._id))!
    assert.equal(page.uri, `/${page.slug}`)
    assert.equal(index.uri, page.uri)
    assert.equal(index.status, "published")
    assert.equal(index.breadcrumbs.at(-1).uri, page.uri)
    assert.equal(page.breadcrumbs.at(-1).url, page.uri)
    assert.equal(page.title, original.title)
    assert.deepEqual(page.updatedAt, original.updatedAt)
    assert.deepEqual(page.sections, [])
  }
  cases.push({
    records: size,
    batches: batches.map(batch => batch.length),
    processed: completed.processed,
    cacheAcknowledged: true,
    checkpointCollections: checkpoints.map(item => item.collection),
  })
}

async function createPage() {
  const slug = `batch-page-${pages.length}`
  // Fixture-only suppression creates real authored versions with stale derived
  // routing. The production worker, not creation hooks, must repair every row.
  pages.push(
    await payload.create({
      collection: "pages",
      data: {
        title: slug,
        slug,
        uri: `/stale-${slug}`,
        sections: [],
        _status: "published",
      },
      context: { preventHooks: true },
      overrideAccess: true,
    })
  )
}

try {
  await drainPublication(payload, async () => {}, 10_000)
  for (const slug of inventory)
    assert.equal(
      (await payload.count({ collection: slug as any, overrideAccess: true })).totalDocs,
      0
    )
  await boundary(0)
  await createPage()
  await boundary(1)
  while (pages.length < BATCH_SIZE) await createPage()
  await boundary(BATCH_SIZE)
  assert.ok((await rows("_pages_versions")).length >= BATCH_SIZE)

  // Pages remain empty; posts have no sections field in their native schema.
  // Both legitimately receive live template sections in the website renderer.
  const posts = []
  for (let index = 0; index < 2; index++)
    posts.push(
      await payload.create({
        collection: "posts",
        data: {
          title: `Template post ${index}`,
          slug: `batch-post-${index}`,
          _status: "published",
        },
        overrideAccess: true,
      })
    )
  const service = await payload.create({
    collection: "services",
    data: {
      title: "Unrelated service",
      slug: "batch-service",
      _status: "published",
      sections: [{ blockType: "hero", heading: "Independent service content" }],
    },
    overrideAccess: true,
  })
  await drainPublication(payload, async () => {}, 60_000)
  const indexIDs = new Map(
    (await rows("uri-indexes")).map(row => [row.documentId, String(row._id)])
  )
  const templateA = await payload.create({
    collection: "templates",
    data: {
      name: "Boundary template A",
      sections: [{ blockType: "hero", heading: "Template A original" }],
    },
    overrideAccess: true,
  })
  const templateB = await payload.create({
    collection: "templates",
    data: {
      name: "Boundary template B",
      sections: [{ blockType: "hero", heading: "Template B original" }],
    },
    overrideAccess: true,
  })
  await payload.updateGlobal({
    slug: "settings",
    data: {
      routing: { pagesDefaultTemplate: templateA.id, postsSingleTemplate: templateB.id },
    },
    overrideAccess: true,
  })
  await drainPublication(payload, async () => {}, 60_000)
  const indexes = await rows("uri-indexes")
  for (const index of indexes) {
    assert.equal(
      String(index._id),
      indexIDs.get(index.documentId),
      "Template assignment replaced route identity"
    )
    const expected =
      index.sourceCollection === "pages"
        ? templateA.id
        : index.sourceCollection === "posts"
          ? templateB.id
          : null
    assert.equal(index.templateId ? String(index.templateId) : null, expected)
  }
  for (const page of await rows("pages")) assert.deepEqual(page.sections, [])
  for (const post of await rows("posts")) assert.ok(!("sections" in post))
  const group = (ids: string[]) =>
    indexes
      .filter(row => ids.includes(row.documentId))
      .map(row => ({ id: row.documentId, uri: row.uri }))
  await writeFile(
    ".smartsite/local/publication-boundaries.json",
    JSON.stringify({
      cases,
      batchSize: BATCH_SIZE,
      templateA: templateA.id,
      templateB: templateB.id,
      pages: group(pages.map(page => page.id)),
      posts: group(posts.map(post => post.id)),
      services: group([service.id]),
    })
  )
  console.log(
    JSON.stringify({
      passed: [
        "real-worker-zero-one-exact-terminal-batches",
        "ack-before-completion",
        "every-derived-route-and-version",
        "two-template-assignment-groups",
      ],
      cases,
    })
  )
} finally {
  await mongo.close()
  await payload.destroy()
}
