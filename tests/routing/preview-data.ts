import assert from "node:assert/strict"
import { createLocalReq, getPayload } from "payload"
import config from "@payload-config"
import { getDraftModeData } from "../../src/lib/data/draft"
const payload = await getPayload({ config })
try {
  const child = (
    await payload.find({
      collection: "pages",
      where: { slug: { equals: "preview-child" } },
      overrideAccess: true,
      depth: 0,
    })
  ).docs[0]
  assert.ok(child)
  for (const username of ["owner", "preview-parent-denied", "preview-title-limited"]) {
    const user = (
      await payload.find({
        collection: "users",
        where: { username: { equals: username } },
        overrideAccess: true,
        depth: 0,
      })
    ).docs[0]
    assert.ok(user)
    const req = await createLocalReq({ user: { ...user, collection: "users" } }, payload)
    for (const hints of [{ collection: "pages", documentId: child.id }, {}]) {
      const result = await getDraftModeData("/preview-parent/preview-child", req, hints)
      assert.ok(result)
      const labels = result.uriIndex.breadcrumbs?.map(item => item.label) ?? []
      if (username === "owner")
        assert.deepEqual(labels, ["Preview parent", "Preview child"])
      else if (username === "preview-parent-denied")
        assert.ok(!labels.includes("Preview parent"))
      else {
        assert.equal(result.document.title, undefined)
        assert.ok(!labels.includes("Preview parent") && !labels.includes("Preview child"))
      }
    }
  }
  console.log(
    JSON.stringify({
      passed: [
        "preview-breadcrumb-hierarchy",
        "preview-breadcrumb-parent-access",
        "preview-breadcrumb-title-field-access",
        "preview-breadcrumb-hint-and-index-paths",
      ],
    })
  )
} finally {
  await payload.destroy()
}
