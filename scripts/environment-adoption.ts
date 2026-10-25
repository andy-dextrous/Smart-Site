// Explicit trusted-operator helper for new hosted / legacy environments. Never
// run by local bootstrap, never creates users, pages, keys or demo content.
import { readFile } from "node:fs/promises"
import { parse } from "dotenv"
const request = JSON.parse(await readFile(process.argv[2], "utf8"))
if (
  request.schemaVersion !== 1 ||
  !request.environmentFile ||
  !request.expectedSiteId ||
  !request.operatorId
)
  throw new Error("Explicit environment, site ID and existing operator required")
const values = parse(await readFile(request.environmentFile))
if (
  values.SMARTSITE_SITE_ID !== request.expectedSiteId ||
  !["preview", "production"].includes(values.SMARTSITE_ENVIRONMENT)
)
  throw new Error("Destination identity/environment mismatch")
// Import Payload only after selecting the explicit environment. Clear inherited
// target selectors to prevent an unrelated staging database fallback.
for (const key of [
  "DATABASE_URL",
  "DATABASE_PROVIDER",
  "STAGING_DATABASE_URL",
  "SMARTSITE_DATABASE_TARGET",
  "PAYLOAD_SECRET",
  "SMARTSITE_SITE_ID",
  "SMARTSITE_ENVIRONMENT",
])
  delete process.env[key]
Object.assign(process.env, values)
const { getPayload } = await import("payload")
const { default: config } = await import("../src/payload.config")
const payload = await getPayload({ config })
try {
  const user = await payload.findByID({
    collection: "users",
    id: request.operatorId,
    depth: 0,
  })
  if (!["admin", "developer"].includes(user.role))
    throw new Error("Existing administrator required")
  const identity = await payload.find({
    collection: "smartsite-identity" as any,
    limit: 2,
  })
  if (
    identity.docs.length &&
    (identity.docs.length !== 1 ||
      (identity.docs[0] as any).siteId !== request.expectedSiteId)
  )
    throw new Error("Different stored identity; adoption refused")
  if (!request.apply) {
    console.log(
      JSON.stringify({
        status: "dry-run",
        siteId: request.expectedSiteId,
        identityPresent: Boolean(identity.docs.length),
      })
    )
  } else if (!identity.docs.length) {
    if (!request.approvedAdoption)
      throw new Error("Review dry run and authorize this target before apply")
    await payload.create({
      collection: "smartsite-identity" as any,
      data: {
        siteId: request.expectedSiteId,
        environment: values.SMARTSITE_ENVIRONMENT,
        setupVersion: 1,
      },
    })
    console.log(
      JSON.stringify({ status: "identity-created", siteId: request.expectedSiteId })
    )
  } else
    console.log(
      JSON.stringify({ status: "already-adopted", siteId: request.expectedSiteId })
    )
} finally {
  await payload.destroy()
}
