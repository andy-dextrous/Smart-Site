import assert from "node:assert/strict"
import { createLocalReq, getPayload } from "payload"
import config from "../../src/payload.config"
import { queuePublication } from "../../src/website/publication/intent"
import {
  claimPublication,
  drainPublication,
  processPublicationBatch,
} from "../../src/website/publication/runner"

const payload = await getPayload({ config })
const collection = "site-publication-work" as any
const request = () => createLocalReq({}, payload)
try {
  // Bootstrap may have queued a settings refresh; this fixture tests DB mechanics only.
  await drainPublication(payload, async () => {}, 10000)
  const before = await payload.count({ collection, overrideAccess: true })
  const req = await request()
  req.transactionID = await payload.db.beginTransaction()
  assert.ok(req.transactionID)
  await queuePublication(req, "refresh", "rollback-proof")
  await payload.jobs.queue({
    task: "dependent-uri-updates",
    input: { operations: [], requestId: "rollback-proof" } as any,
    req,
  })
  await payload.db.rollbackTransaction(req.transactionID)
  assert.equal(
    (await payload.count({ collection, overrideAccess: true })).totalDocs,
    before.totalDocs
  )
  assert.equal(
    (
      await payload.find({
        collection: "payload-jobs",
        where: { "input.requestId": { equals: "rollback-proof" } },
        overrideAccess: true,
      })
    ).totalDocs,
    0
  )

  const id = await queuePublication(await request(), "routes", "claim-proof")
  const claims = await Promise.all([claimPublication(payload), claimPublication(payload)])
  assert.equal(claims.filter(Boolean).length, 1)
  const stale = claims.find(Boolean)!
  await payload.db.updateOne({
    collection,
    where: { id: { equals: id } },
    data: { leaseUntil: new Date(Date.now() - 1000).toISOString() },
    returning: true,
  })
  const replacement = await claimPublication(payload)
  assert.ok(replacement)
  assert.equal(replacement.generation, stale.generation + 1)
  await assert.rejects(processPublicationBatch(payload, stale), /lease lost/)
  const unchanged = (await payload.findByID({
    collection,
    id: id!,
    overrideAccess: true,
  })) as any
  assert.equal(unchanged.processed, 0)
  assert.equal(unchanged.owner, replacement.owner)
  await payload.db.updateOne({
    collection,
    where: { id: { equals: id } },
    data: { status: "pending", owner: null, leaseUntil: null, kind: "refresh" },
    returning: true,
  })
  await drainPublication(payload, async () => {
    throw new Error("injected cache failure")
  })
  const failed = (await payload.findByID({
    collection,
    id: id!,
    overrideAccess: true,
  })) as any
  assert.equal(failed.status, "pending")
  assert.equal(failed.attempts, replacement.attempts + 1)
  assert.ok(!failed.cacheAcknowledgedAt)
  await drainPublication(payload, async () => {})
  const done = (await payload.findByID({
    collection,
    id: id!,
    overrideAccess: true,
  })) as any
  assert.equal(done.status, "completed")
  assert.ok(done.cacheAcknowledgedAt)
  const parent = await payload.create({
    collection: "pages",
    data: { title: "Parent", slug: "parent", _status: "published", sections: [] },
    overrideAccess: true,
  })
  const child = await payload.create({
    collection: "pages",
    data: {
      title: "Published child",
      slug: "child",
      parent: parent.id,
      _status: "published",
      sections: [],
    },
    overrideAccess: true,
  })
  await payload.update({
    collection: "pages",
    id: child.id,
    data: { title: "Secret unfinished draft", _status: "draft" },
    draft: true,
    overrideAccess: true,
  })
  const draftIndex = await payload.find({
    collection: "uri-index",
    where: { documentId: { equals: String(child.id) } },
    depth: 0,
    overrideAccess: true,
  })
  assert.equal(
    draftIndex.docs[0].status,
    "published",
    "Saving a local API draft must not unpublish the URI index"
  )
  const versionsBefore = await payload.findVersions({
    collection: "pages",
    where: { parent: { equals: child.id } },
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })
  const publicBefore = await payload.findByID({
    collection: "pages",
    id: child.id,
    draft: false,
    overrideAccess: true,
  })
  await payload.update({
    collection: "pages",
    id: parent.id,
    data: { slug: "moved-parent", createAutomaticRedirect: true },
    overrideAccess: true,
  })
  await drainPublication(payload, async () => {}, 20000)
  const publicAfter = await payload.findByID({
    collection: "pages",
    id: child.id,
    draft: false,
    overrideAccess: true,
  })
  const draftAfter = await payload.findByID({
    collection: "pages",
    id: child.id,
    draft: true,
    overrideAccess: true,
  })
  const versionsAfter = await payload.findVersions({
    collection: "pages",
    where: { parent: { equals: child.id } },
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })
  assert.equal(publicAfter.title, "Published child")
  assert.equal(publicAfter.uri, "/moved-parent/child")
  assert.equal(publicAfter.updatedAt, publicBefore.updatedAt)
  assert.equal(draftAfter.title, "Secret unfinished draft")
  assert.deepEqual(versionsAfter.docs, versionsBefore.docs)
  await assert.rejects(
    payload.create({
      collection: "pages",
      data: { title: "Reserved", slug: "admin", _status: "published", sections: [] },
      overrideAccess: true,
    }),
    /reserved/
  )

  // Renaming out and back must remove only automatic sources at the canonical URI.
  await payload.update({
    collection: "pages",
    id: parent.id,
    data: { slug: "parent", createAutomaticRedirect: true },
    overrideAccess: true,
  })
  await drainPublication(payload, async () => {}, 20000)
  const loop = await payload.find({
    collection: "redirects",
    where: { and: [{ from: { equals: "/parent" } }, { type: { equals: "automatic" } }] },
    overrideAccess: true,
  })
  assert.equal(loop.totalDocs, 0)
  await assert.rejects(
    payload.update({
      collection: "pages",
      id: parent.id,
      data: { parent: child.id },
      overrideAccess: true,
    }),
    /cycle/
  )
  await assert.rejects(
    payload.delete({ collection: "pages", id: parent.id, overrideAccess: true }),
    /Reparent/
  )
  await assert.rejects(
    payload.update({
      collection: "pages",
      id: parent.id,
      data: { deletedAt: new Date().toISOString() },
      overrideAccess: true,
    }),
    /Reparent/
  )
  await payload.update({
    collection: "pages",
    id: child.id,
    data: { parent: null, _status: "published" },
    overrideAccess: true,
  })
  await drainPublication(payload, async () => {}, 20000)
  assert.equal(
    (await payload.findByID({ collection: "pages", id: child.id, overrideAccess: true }))
      .uri,
    "/child"
  )
  await payload.updateGlobal({
    slug: "settings",
    data: { routing: { homepage: parent.id } },
    overrideAccess: true,
  })
  await drainPublication(payload, async () => {}, 20000)
  await payload.update({
    collection: "pages",
    id: parent.id,
    data: { slug: "renamed-home", createAutomaticRedirect: true },
    overrideAccess: true,
  })
  await drainPublication(payload, async () => {}, 20000)
  assert.equal(
    (await payload.findByID({ collection: "pages", id: parent.id, overrideAccess: true }))
      .uri,
    "/"
  )
  const rootRedirect = await payload.find({
    collection: "redirects",
    where: { and: [{ from: { equals: "/" } }, { type: { equals: "automatic" } }] },
    overrideAccess: true,
  })
  assert.equal(rootRedirect.totalDocs, 0)
  const nestedSameSlug = await payload.create({
    collection: "pages",
    data: {
      title: "Another home slug",
      slug: "renamed-home",
      parent: child.id,
      _status: "published",
      sections: [],
    },
    overrideAccess: true,
  })
  assert.equal(nestedSameSlug.uri, "/child/renamed-home")

  const archive = await payload.create({
    collection: "pages",
    data: { title: "Articles", slug: "articles", _status: "published", sections: [] },
    overrideAccess: true,
  })
  const post = await payload.create({
    collection: "posts",
    data: { title: "Public article", slug: "route-proof", _status: "published" },
    overrideAccess: true,
  })
  await payload.update({
    collection: "posts",
    id: post.id,
    data: { title: "Unfinished article draft", _status: "draft" },
    draft: true,
    overrideAccess: true,
  })
  await payload.updateGlobal({
    slug: "settings",
    data: { routing: { postsArchivePage: archive.id } },
    overrideAccess: true,
  })
  await drainPublication(payload, async () => {}, 20000)
  await payload.update({
    collection: "posts",
    id: post.id,
    data: { title: "Edited public article", _status: "published" },
    overrideAccess: true,
  })
  assert.equal(
    (await payload.findByID({ collection: "posts", id: post.id, overrideAccess: true }))
      .uri,
    "/articles/route-proof"
  )
  await assert.rejects(
    payload.delete({ collection: "pages", id: archive.id, overrideAccess: true }),
    /archive page/
  )
  await assert.rejects(
    payload.update({
      collection: "pages",
      id: archive.id,
      data: { deletedAt: new Date().toISOString() },
      overrideAccess: true,
    }),
    /archive page/
  )
  await payload.update({
    collection: "pages",
    id: parent.id,
    data: { deletedAt: new Date().toISOString() },
    overrideAccess: true,
  })
  await drainPublication(payload, async () => {}, 20000)
  assert.equal(
    (await payload.findGlobal({ slug: "settings", depth: 0, overrideAccess: true }))
      .routing?.homepage,
    null
  )

  console.log(
    JSON.stringify({
      passed: [
        "transactional-intent-rollback",
        "native-queue-transaction-rollback",
        "two-runners-one-claim",
        "abandoned-claim-takeover",
        "old-runner-fenced",
        "failed-cache-remains-pending",
        "replay-completes",
        "route-change-preserves-published-content-draft-versions-timestamp",
        "reserved-path-rejected",
        "canonical-return-removes-loop",
        "cycle-rejected",
        "clear-parent",
        "homepage-rename-stable",
        "same-slug-is-not-homepage",
      ],
    })
  )
} finally {
  await payload.destroy()
}
