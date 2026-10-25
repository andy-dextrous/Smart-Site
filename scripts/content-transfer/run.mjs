import path from "node:path"
import { readFile, mkdir } from "node:fs/promises"
import { parse } from "dotenv"
import { cleanEnvironment, runNode } from "../local/state.mjs"
const index = process.argv.indexOf("--request")
if (index < 0)
  throw new Error("Provide a private --request JSON file; dry-run is the default")
const requestFile = path.resolve(process.argv[index + 1]),
  request = JSON.parse(await readFile(requestFile, "utf8"))
if (
  request.schemaVersion !== 1 ||
  !["export", "import"].includes(request.action) ||
  !request.environmentFile ||
  !request.expectedSiteId
)
  throw new Error(
    "Request requires schemaVersion 1, action, environmentFile and expectedSiteId"
  )
const values = parse(await readFile(path.resolve(request.environmentFile)))
if (
  values.SMARTSITE_SITE_ID !== request.expectedSiteId ||
  !values.DATABASE_PROVIDER ||
  !values.DATABASE_URL
)
  throw new Error("Explicit environment identity/database required")
await mkdir(".smartsite/transfers", { recursive: true, mode: 0o700 })
await runNode(
  ["--import", "tsx", "scripts/content-transfer/worker.ts", requestFile],
  cleanEnvironment({ ...values, SMARTSITE_TRANSFER_REQUEST: requestFile }),
  ".smartsite/transfers/worker.log"
)
console.log(
  JSON.stringify({
    status: "completed",
    report: request.reportFile || ".smartsite/transfers/report.json",
  })
)
