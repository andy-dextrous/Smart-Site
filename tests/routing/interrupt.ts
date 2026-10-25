import { getPayload } from "payload"
import config from "../../src/payload.config"
import {
  claimPublication,
  processPublicationBatch,
} from "../../src/lib/publication/runner"
const payload = await getPayload({ config })
const work = await claimPublication(payload)
if (!work) throw new Error("Expected claimable publication work")
const next = await processPublicationBatch(payload, work)
process.stdout.write(`CHECKPOINT_COMMITTED:${next.id}\n`)
// Parent test kills this process. No graceful release can conceal abandoned work.
await new Promise(() => {})
