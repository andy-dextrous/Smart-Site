import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { getPayload } from "payload"
import config from "../../src/admin/payload/payload.config"

const local = path.resolve(".smartsite/local")
const state = JSON.parse(await readFile(path.join(local, "state.json"), "utf8"))
const credentials = JSON.parse(
  await readFile(path.join(local, "credentials.json"), "utf8")
)
if (
  process.env.SMARTSITE_SITE_ID !== state.siteId ||
  process.env.SMARTSITE_ENVIRONMENT !== "local"
)
  throw new Error("Local provisioning identity mismatch")
const payload = await getPayload({ config })
try {
  // Wait for Mongo model/index initialization before the first transaction.
  await Promise.all(
    Object.values((payload.db as any).collections ?? {}).map((model: any) => model.init())
  )
  const identities = await payload.find({
    collection: "smartsite-identity" as any,
    limit: 2,
  })
  if (identities.docs.length && (identities.docs[0] as any).siteId !== state.siteId)
    throw new Error("Database belongs to a different site")
  const users = await payload.find({ collection: "users", limit: 2 })
  if (!identities.docs.length && users.docs.length)
    throw new Error(
      "Existing site detected. Inspect and upgrade; bootstrap will not adopt or seed it."
    )
  if (!identities.docs.length) {
    const globalsModel = (payload.db as any).globals
    if (globalsModel && (await globalsModel.countDocuments()))
      throw new Error(
        "Existing saved globals detected. Use the reviewed upgrade procedure, not bootstrap."
      )
    for (const collection of Object.keys(payload.collections).filter(
      slug => !slug.startsWith("payload-") && !slug.startsWith("smartsite-")
    )) {
      if (!payload.collections[collection as keyof typeof payload.collections]) continue
      const existing = await payload.count({ collection: collection as any })
      if (existing.totalDocs)
        throw new Error(
          "Existing content detected. Use the reviewed upgrade procedure, not bootstrap."
        )
    }
  }
  const keys = await payload.find({
    collection: "payload-mcp-api-keys" as any,
    where: { label: { equals: `local-${state.siteId}` } },
    limit: 1,
    depth: 0,
  })
  const settings = await payload.findGlobal({ slug: "settings", depth: 0 })
  const transactionID = await payload.db.beginTransaction()
  if (!transactionID) throw new Error("Mongo transactions unavailable")
  const req: any = { payload, transactionID, context: { preventHooks: true } }
  let changed = false
  try {
    if (!identities.docs.length) changed = true
    if (!identities.docs.length)
      await payload.create({
        collection: "smartsite-identity" as any,
        data: { siteId: state.siteId, environment: "local", setupVersion: 1 },
        req,
      })
    let user = users.docs[0]
    if (!user) changed = true
    if (!user)
      user = await payload.create({
        collection: "users",
        data: {
          email: state.email,
          username: "owner",
          name: "Site",
          lastName: "Owner",
          password: credentials.adminPassword,
          role: "developer",
        },
        req,
      })
    if (!keys.docs.length) changed = true
    if (!keys.docs.length)
      await payload.create({
        collection: "payload-mcp-api-keys" as any,
        data: {
          label: `local-${state.siteId}`,
          user: user.id,
          enableAPIKey: true,
          apiKey: credentials.mcpKey,
          "payload-mcp-tool": {
            smartsiteRead: true,
            smartsiteSave: true,
            smartsiteUploadMedia: true,
            smartsiteOperationStatus: true,
          },
        },
        req,
      })
    if (!identities.docs.length) changed = true
    if (!identities.docs.length)
      await payload.updateGlobal({
        slug: "settings",
        data: { general: { siteName: state.siteName } },
        req,
      })
    if (changed) await payload.db.commitTransaction(transactionID)
    else await payload.db.rollbackTransaction(transactionID).catch(() => undefined)
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID).catch(() => undefined)
    throw error
  }
  await writeFile(
    path.join(local, "essentials.json"),
    JSON.stringify({ siteId: state.siteId, setupVersion: 1 }),
    { mode: 0o600 }
  )
} finally {
  await payload.destroy()
}
