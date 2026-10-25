import { createRequire } from "node:module"
import { pathToFileURL } from "node:url"
import path from "node:path"
import { loadRequest, save, json } from "./common.mjs"
import { assertSchedulingConfiguration } from "./scheduled-publishing.mjs"
const { request, env, fingerprint } = await loadRequest()
// Select only the inspected environment; never inherit a different database target.
for (const key of Object.keys(process.env))
  if (
    /^(DATABASE_|STAGING_|SMARTSITE_|PAYLOAD_|BLOB_|VERCEL_BLOB_|S3_|AWS_|RESEND_|CRON_SECRET)/.test(
      key
    )
  )
    delete process.env[key]
Object.assign(process.env, env, { DISABLE_PAYLOAD_HMR: "true", NODE_ENV: "production" })
delete process.env.PORT
const require = createRequire(path.join(request.siteRoot, "package.json"))
const { getPayload } = await import(pathToFileURL(require.resolve("payload")).href)
const { default: config } = await import(
  pathToFileURL(path.join(request.siteRoot, "src/payload.config.ts")).href
)
const { migrateLegacyPublication } = await import(
  pathToFileURL(path.join(request.siteRoot, "src/payload/upgrades/run.ts")).href
)
// This offline operation must not launch application startup callbacks or workers.
const resolved = await config
const inspection = await json(path.join(request.reportDirectory, "inspection.json"))
if (inspection.fingerprint !== fingerprint)
  throw new Error("Scheduling inspection does not match this request")
assertSchedulingConfiguration(
  request,
  inspection.before.scheduledPublishing,
  env,
  resolved
)
resolved.onInit = undefined
resolved.jobs = { ...resolved.jobs, autoRun: [] }
resolved.email = () => ({
  name: "upgrade-migration",
  defaultFromAddress: "disabled@example.invalid",
  defaultFromName: "Disabled",
  sendEmail: async () => {
    throw new Error("Email disabled during upgrade migration")
  },
})
if (process.argv.includes("--check-configuration")) {
  console.log(
    JSON.stringify({
      status: "scheduling-configuration-checked",
      jobs: inspection.before.scheduledPublishing?.length || 0,
    })
  )
  process.exit(0)
}
const payload = await getPayload({ config: resolved })
try {
  const receipt = await migrateLegacyPublication(payload, fingerprint)
  await save(path.join(request.reportDirectory, "migration.json"), {
    schemaVersion: 1,
    fingerprint,
    status: receipt.status,
    receiptId: receipt.id,
    convertedJobs: receipt.convertedJobs,
    publicationWorkId: receipt.workId || null,
  })
  console.log(
    JSON.stringify({
      status: receipt.status,
      convertedJobs: receipt.convertedJobs?.length || 0,
      publicationWorkId: receipt.workId || null,
    })
  )
} finally {
  await payload.destroy()
}
