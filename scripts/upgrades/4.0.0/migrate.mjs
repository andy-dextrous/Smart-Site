import { validateBackup } from "./common.mjs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { spawnSync } from "node:child_process"
import {
  loadRequest,
  json,
  save,
  readOptional,
  sourceHashes,
  walkSource,
  digest,
} from "./common.mjs"
import { compareUpgradeDatabase } from "./mongo.mjs"
const context = await loadRequest()
const { request, fingerprint } = context
const inspection = await json(path.join(request.reportDirectory, "inspection.json"))
const reconciliation = await json(
  path.join(request.reportDirectory, "reconciliation.json")
)
const proof = await json(path.join(request.reportDirectory, "backup-proof.json"))
await validateBackup(context, proof)
if (
  [inspection, reconciliation, proof].some(item => item.fingerprint !== fingerprint) ||
  reconciliation.status !== "source-applied" ||
  !proof.restored
)
  throw new Error("Matching inspected, reconciled source and restored backup required")
if (!request.writesQuiesced)
  throw new Error(
    "Stop old app/workers and record writesQuiesced in the original request before inspection"
  )
if ((await json(path.join(request.siteRoot, "package.json"))).version !== "4.0.2")
  throw new Error("Reconciled source is not 4.0.2")
const { after: current, differences } = await compareUpgradeDatabase(
  context,
  inspection.before
)
if (differences.length)
  throw new Error(`Data changed after inspection: ${differences.join(", ")}`)
const configCheck = spawnSync(
  process.execPath,
  [
    "--import",
    path.join(request.siteRoot, "node_modules/tsx/dist/loader.mjs"),
    fileURLToPath(new URL("./data-worker.mjs", import.meta.url)),
    "--request",
    context.requestFile,
    "--check-configuration",
  ],
  {
    cwd: request.siteRoot,
    env: { ...process.env, DISABLE_PAYLOAD_HMR: "true" },
    stdio: "inherit",
  }
)
if (configCheck.error || configCheck.status !== 0)
  throw new Error("Reconciled scheduling configuration requires review before migration")
const hashes = await sourceHashes(request.siteRoot, await walkSource(request.siteRoot))
const dryRun = {
  schemaVersion: 1,
  fingerprint,
  sourceHash: digest(JSON.stringify(hashes)),
  database: current,
  status: "dry-run",
  contentRewrite: false,
}
const dryFile = path.join(request.reportDirectory, "migration-dry-run.json")
if (!process.argv.includes("--apply")) {
  await save(dryFile, dryRun)
  console.log(
    JSON.stringify({
      status: "dry-run",
      contentRewrite: false,
      next: "Review this report, then repeat with --apply while writes remain stopped",
    })
  )
} else {
  const previous = await json(dryFile)
  if (previous.fingerprint !== fingerprint || previous.sourceHash !== dryRun.sourceHash)
    throw new Error("Source changed since dry run")
  const child = spawnSync(
    process.execPath,
    [
      "--import",
      path.join(request.siteRoot, "node_modules/tsx/dist/loader.mjs"),
      fileURLToPath(new URL("./data-worker.mjs", import.meta.url)),
      "--request",
      context.requestFile,
    ],
    {
      cwd: request.siteRoot,
      env: { ...process.env, DISABLE_PAYLOAD_HMR: "true" },
      stdio: "inherit",
    }
  )
  if (child.error || child.status !== 0)
    throw new Error(
      "Migration stopped; retain reports and rerun the same request after repair"
    )
}
