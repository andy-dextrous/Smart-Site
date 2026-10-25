import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import path from "node:path"
import {
  loadRequest,
  save,
  requireCleanGit,
  sourceHashes,
  walkSource,
} from "./common.mjs"
import { databaseSnapshot } from "./mongo.mjs"
import { assertSchedulingDecision } from "./scheduled-publishing.mjs"
const context = await loadRequest()
const { request, fingerprint, baseline, target } = context
const commit = requireCleanGit(request.siteRoot)
const hashes = await sourceHashes(request.siteRoot, await walkSource(request.siteRoot))
const changed = [...baseline]
  .filter(([file, hash]) => hashes[file] !== hash)
  .map(([file]) => file)
const added = Object.keys(hashes).filter(file => !baseline.has(file))
const settings = spawnSync(
  process.execPath,
  [
    "--import",
    path.join(request.siteRoot, "node_modules/tsx/dist/loader.mjs"),
    fileURLToPath(new URL("./settings-inventory.mjs", import.meta.url)),
    "--request",
    context.requestFile,
  ],
  { cwd: request.siteRoot, env: process.env, stdio: "inherit" }
)
if (settings.error || settings.status !== 0)
  throw new Error("Site setting inventory requires review before upgrade")
const before = await databaseSnapshot(context)
await save(path.join(request.reportDirectory, "scheduled-publishing-inventory.json"), {
  fingerprint,
  jobs: before.scheduledPublishing,
  decision: request.scheduledPublishing?.decision ?? null,
  note: "Read only; all original job bytes remain unchanged. Due work must not run until the upgrade and chosen activation are verified.",
})
assertSchedulingDecision(request, before.scheduledPublishing, context.env)
const report = {
  schemaVersion: 1,
  fingerprint,
  siteId: request.expectedSiteId,
  sourceVersion: request.sourceVersion,
  targetVersion: request.targetVersion,
  commit,
  hashes,
  changed,
  added,
  targetFiles: target.size,
  before,
  status: "inspection-complete",
  next: "Back up and restore-check source/database/media; reconcile source using the change map; do not bootstrap or seed this site.",
}
await save(path.join(request.reportDirectory, "inspection.json"), report)
console.log(
  JSON.stringify({
    status: report.status,
    changed,
    added,
    collections: before.collections.length,
    siteId: report.siteId,
  })
)
