import assert from "node:assert/strict"
import { writeFile, rm, access } from "node:fs/promises"
import { createLocalReq, getPayload } from "payload"
import sharp from "sharp"
import config from "../../src/payload.config"
import { contentRead, contentSave, uploadMedia } from "../../src/payload/mcp/tools"
import { withOperation, operationStatus } from "../../src/payload/mcp/operations"
if (process.env.SMARTSITE_ENVIRONMENT !== "local") throw new Error("Local fixture only")
const payload = await getPayload({ config })
try {
  const user = (await payload.find({ collection: "users", limit: 1 })).docs[0]
  const req = await createLocalReq(
    {
      user: { ...user, collection: "users" },
      context: { smartsiteKeyId: "contract-fixture" },
    },
    payload
  )
  const pageConfig = payload.collections.pages.config
  pageConfig.fields.push({
    name: "privateFixture",
    type: "group",
    access: { read: () => false },
    fields: [
      {
        name: "hidden",
        type: "text",
        defaultValue: "secret-schema-sentinel",
        admin: { description: "secret-schema-sentinel" },
      },
    ],
  })
  const schema = await contentRead({ action: "schema", target: "pages" }, req)
  assert.ok(!JSON.stringify(schema).includes("secret-schema-sentinel"))
  assert.ok(!JSON.stringify(schema).includes("privateFixture"))
  await assert.rejects(
    contentRead(
      { action: "schema", target: "pages", field: "privateFixture.hidden" },
      req
    )
  )
  const before = pageConfig.access.read
  pageConfig.access.read = () => false
  await assert.rejects(contentRead({ action: "schema", target: "pages" }, req))
  assert.ok(
    !JSON.parse(
      (await contentRead({ action: "catalogue" }, req)).content[0].text
    ).collections.includes("pages")
  )
  pageConfig.access.read = before
  const rollbackOperation = {
    target: "posts",
    action: "create",
    mode: "publish",
    operationId: crypto.randomUUID(),
    data: {
      title: "Rollback proof",
      slug: "rollback-proof",
      sections: [{ blockType: "posts-hero" }],
    },
  }
  await assert.rejects(
    withOperation(rollbackOperation, req, async (args, tx) => {
      await contentSave(args, tx)
      throw new Error("Injected after content/index write")
    }),
    /Injected/
  )
  assert.equal(
    (
      await payload.count({
        collection: "posts",
        where: { slug: { equals: "rollback-proof" } },
      })
    ).totalDocs,
    0
  )
  assert.equal(
    (
      await payload.count({
        collection: "uri-index",
        where: { uri: { equals: "/posts/rollback-proof" } },
      })
    ).totalDocs,
    0
  )
  const renameBase = JSON.parse(
    (
      await withOperation(
        {
          ...rollbackOperation,
          operationId: crypto.randomUUID(),
          data: {
            title: "Rename proof",
            slug: "rename-proof",
            sections: [{ blockType: "posts-hero" }],
          },
        },
        req,
        contentSave
      )
    ).content[0].text
  )
  const renameOperation = {
    target: "posts",
    action: "update",
    mode: "publish",
    operationId: crypto.randomUUID(),
    id: renameBase.document.id,
    expectedRevision: renameBase.revision,
    data: { slug: "rolled-back-rename" },
  }
  await assert.rejects(
    withOperation(renameOperation, req, async (args, tx) => {
      await contentSave(args, tx)
      throw new Error("Injected rename rollback")
    }),
    /Injected/
  )
  assert.equal(
    (await payload.findByID({ collection: "posts", id: renameBase.document.id })).slug,
    "rename-proof"
  )
  assert.equal(
    (
      await payload.count({
        collection: "uri-index",
        where: { uri: { equals: "/posts/rename-proof" } },
      })
    ).totalDocs,
    1
  )
  assert.equal(
    (
      await payload.count({
        collection: "uri-index",
        where: { uri: { equals: "/posts/rolled-back-rename" } },
      })
    ).totalDocs,
    0
  )
  assert.equal(
    (
      await payload.count({
        collection: "redirects",
        where: { from: { equals: "/posts/rename-proof" } },
      })
    ).totalDocs,
    0
  )
  const originalCreate = payload.create.bind(payload)
  const marker = ".smartsite/storage-failure-proof"
  ;(payload as any).create = async (args: any) => {
    if (args.collection === "media") {
      await writeFile(marker, "owned disposable partial storage effect", { mode: 0o600 })
      throw new Error("Injected storage failure")
    }
    return originalCreate(args)
  }
  const bytes = await sharp({
    create: { width: 9, height: 9, channels: 3, background: "#12ef89" },
  })
    .png()
    .toBuffer()
  const args = {
    target: "media",
    operationId: crypto.randomUUID(),
    base64: bytes.toString("base64"),
    alt: "Failure test",
  }
  await assert.rejects(withOperation(args, req, uploadMedia), /Injected/)
  payload.create = originalCreate
  assert.equal(
    JSON.parse((await operationStatus(args, req)).content[0].text).status,
    "storage-pending"
  )
  await assert.rejects(withOperation(args, req, uploadMedia), /unfinished storage/)
  await access(marker)
  // Simulate reviewed repair of this exact owned failure, never broad cleanup.
  const reservation = await payload.find({
    collection: "smartsite-uploads" as any,
    where: { state: { equals: "pending" } },
    limit: 1,
  })
  await rm(marker)
  await payload.delete({
    collection: "smartsite-uploads" as any,
    id: reservation.docs[0].id,
  })
  const recovered = JSON.parse(
    (await withOperation(args, req, uploadMedia)).content[0].text
  )
  assert.ok(recovered.document.id)
  console.log(
    JSON.stringify({
      passed: [
        "content-and-uri-rollback-together",
        "slug-and-redirect-rollback-together",
        "schema-field-and-parent-access",
        "schema-collection-access",
        "durable-storage-pending",
        "no-blind-storage-retry",
        "reviewed-storage-recovery",
      ],
    })
  )
} finally {
  await payload.destroy()
}
