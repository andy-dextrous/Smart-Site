import { writeFile } from "node:fs/promises"
import { createLocalReq, getPayload } from "payload"
import config from "../../src/payload.config"
import sharp from "sharp"
import { contentSave, uploadMedia } from "../../src/mcp/tools"
import { withOperation } from "../../src/mcp/operations"
const payload = await getPayload({ config })
try {
  const owner = (await payload.find({ collection: "users", limit: 1 })).docs[0]
  const req = await createLocalReq(
    {
      user: { ...owner, collection: "users" },
      context: { smartsiteKeyId: "transfer-fixture" },
    },
    payload
  )
  const bytes = await sharp({
    create: { width: 16, height: 16, channels: 3, background: "#335588" },
  })
    .png()
    .toBuffer()
  const media = JSON.parse(
    (
      await withOperation(
        {
          target: "media",
          operationId: crypto.randomUUID(),
          base64: bytes.toString("base64"),
          alt: "Portable fixture image",
        },
        req,
        uploadMedia
      )
    ).content[0].text
  )
  const saved = JSON.parse(
    (
      await withOperation(
        {
          operationId: crypto.randomUUID(),
          target: "posts",
          action: "create",
          mode: "draft",
          data: {
            title: "Portable story",
            slug: "portable-story",
            authors: [owner.id],
            featuredImage: media.document.id,
          },
        },
        req,
        contentSave
      )
    ).content[0].text
  )
  await writeFile(
    ".smartsite/transfer-fixture.json",
    JSON.stringify({ owner: owner.id, post: saved.document.id }),
    { mode: 0o600 }
  )
} finally {
  await payload.destroy()
}
