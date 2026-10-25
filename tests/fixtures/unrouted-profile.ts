import assert from "node:assert/strict"
import { createLocalReq, type Payload } from "payload"
import { queuePublication } from "../../src/lib/publication/intent"
import { drainPublication, publicationStatus } from "../../src/lib/publication/runner"

export async function exerciseUnroutedProfile(
  payload: Payload,
  deliver: () => Promise<void>
) {
  const media = await payload.find({
    collection: "media",
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  assert.ok(media.docs[0], "Fixture needs its integration upload")
  const profile = await payload.create({
    collection: "team",
    overrideAccess: true,
    data: {
      name: "Unrouted profile proof",
      email: "unrouted-profile@example.test",
      image: media.docs[0].id,
      role: "Fixture",
      bio: "Content without a page",
      slug: "",
    },
  })
  const edited = await payload.update({
    collection: "team",
    id: profile.id,
    data: { bio: "Edited without inventing a URL" },
    overrideAccess: true,
  })
  assert.equal(edited.slug, "")
  assert.ok(!edited.uri)
  const countIndexes = async () =>
    (
      await payload.count({
        collection: "uri-index",
        where: {
          and: [
            { sourceCollection: { equals: "team" } },
            { documentId: { equals: String(profile.id) } },
          ],
        },
        overrideAccess: true,
      })
    ).totalDocs
  assert.equal(await countIndexes(), 0)
  const workID = await queuePublication(
    await createLocalReq({}, payload),
    "routes",
    "unrouted-profile-proof"
  )
  await drainPublication(payload, deliver, 60000)
  const completed = (await publicationStatus(payload, [workID!])).work[0]
  assert.equal(completed.status, "completed")
  assert.ok(completed.skipped >= 1)
  assert.ok(completed.skippedExamples.includes(`team/${profile.id}`))
  assert.equal(await countIndexes(), 0)
  const unchanged = await payload.findByID({
    collection: "team",
    id: profile.id,
    overrideAccess: true,
  })
  assert.equal(unchanged.updatedAt, edited.updatedAt)

  const routed = await payload.update({
    collection: "team",
    id: profile.id,
    data: { slug: "unrouted-profile-proof" },
    overrideAccess: true,
  })
  assert.ok(routed.uri?.endsWith("/unrouted-profile-proof"))
  assert.equal(await countIndexes(), 1)
  // Simulate a corrupt historical routed row without running content validation.
  // This is confined to the fixture; the worker must report it, not silently skip it.
  await payload.db.updateOne({
    collection: "team",
    where: { id: { equals: profile.id } },
    data: { slug: "", updatedAt: null },
    returning: true,
  })
  let brokenID: string | undefined
  try {
    brokenID = await queuePublication(
      await createLocalReq({}, payload),
      "routes",
      "unrouted-existing-route-proof"
    )
    await drainPublication(payload, deliver, 60000)
    const failed = (await publicationStatus(payload, [brokenID!])).work[0]
    assert.equal(failed.status, "pending")
    assert.equal(failed.attempts, 1)
    assert.ok(failed.error)
    assert.ok(!failed.cacheAcknowledgedAt)
    assert.equal(await countIndexes(), 1)
  } finally {
    await payload.db.updateOne({
      collection: "team",
      where: { id: { equals: profile.id } },
      data: { slug: "unrouted-profile-proof", updatedAt: null },
      returning: true,
    })
    await drainPublication(payload, deliver, 60000)
  }
  assert.equal(
    (await publicationStatus(payload, [brokenID!])).work[0].status,
    "completed"
  )
  return {
    id: profile.id,
    uri: routed.uri,
    skipped: completed.skipped,
    passed: [
      "unrouted-profile-edit",
      "unrouted-profile-scan-skip-reported",
      "skip-preserves-source-timestamp",
      "explicit-slug-creates-route",
      "blank-existing-route-fails-visibly",
    ],
  }
}
