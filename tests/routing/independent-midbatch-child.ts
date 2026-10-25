import { getPayload } from "payload"
import config from "../../src/payload.config"
import {
  claimPublication,
  processPublicationBatch,
} from "../../src/lib/publication/runner"
const payload = await getPayload({ config })
const ids = new Set(JSON.parse(process.env.REVIEW_PUBLICATION_IDS!))
const original = payload.db.updateOne.bind(payload.db)
let writes = 0
payload.db.updateOne = async args => {
  const result = await original(args)
  if (
    args.collection === "pages" &&
    args.req?.transactionID &&
    ids.has(String((args.where as any)?.id?.equals))
  ) {
    writes++
    if (writes === 3) {
      console.log("INDEPENDENT_MIDBATCH_WRITES_UNCOMMITTED")
      await new Promise(() => {})
    }
  }
  return result
}
const claim = await claimPublication(payload)
if (!claim || claim.id !== process.env.REVIEW_PUBLICATION_WORK)
  throw new Error("Wrong independent work claim")
await processPublicationBatch(payload, claim)
throw new Error("Expected parent to kill worker inside transaction")
