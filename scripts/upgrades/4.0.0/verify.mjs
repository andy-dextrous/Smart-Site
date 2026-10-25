import { validateBackup } from "./common.mjs"
import path from "node:path"
import { readFile } from "node:fs/promises"
import { loadRequest, json, digest, save, safePath } from "./common.mjs"
import { compareUpgradeDatabase } from "./mongo.mjs"
const context = await loadRequest()
const { request, fingerprint } = context
const inspection = await json(path.join(request.reportDirectory, "inspection.json"))
const proof = await json(path.join(request.reportDirectory, "backup-proof.json"))
await validateBackup(context, proof)
const migration = await json(path.join(request.reportDirectory, "migration.json"))
if (
  [inspection, proof, migration].some(item => item.fingerprint !== fingerprint) ||
  migration.status !== "completed"
)
  throw new Error("Migration evidence does not match this request")
const { differences, after, receipt } = await compareUpgradeDatabase(
  context,
  inspection.before
)
if (differences.length || receipt?.status !== "completed")
  throw new Error(`Content preservation check failed: ${differences.join(", ")}`)
for (const media of proof.media) {
  if (
    digest(
      await readFile(safePath(path.join(request.siteRoot, "public/media"), media.path))
    ) !== media.sha256
  )
    throw new Error(`Local media changed or disappeared: ${media.path}`)
}
for (const item of proof.hostedMedia || []) {
  if (
    digest(
      await readFile(safePath(path.join(request.reportDirectory, "backup"), item.path))
    ) !== item.sha256
  )
    throw new Error("Hosted media backup changed")
  const response = await fetch(item.url, {
    signal: AbortSignal.timeout(30000),
    redirect: "error",
  })
  if (!response.ok || digest(Buffer.from(await response.arrayBuffer())) !== item.sha256)
    throw new Error("Hosted media changed or became unavailable during upgrade")
}
const report = {
  schemaVersion: 1,
  fingerprint,
  status: "data-preserved",
  siteId: request.expectedSiteId,
  collections: after.collections.length,
  localMedia: proof.media.length,
  publicationWorkId: migration.publicationWorkId,
  runtimeAcceptance:
    "required separately: frozen install, generated files, production build, browser, MCP and publication completion",
}
await save(path.join(request.reportDirectory, "verification.json"), report)
console.log(JSON.stringify(report))
