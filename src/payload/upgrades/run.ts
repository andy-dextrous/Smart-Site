import { createLocalReq, type Payload } from "payload"
import { queuePublication } from "@/lib/publication/intent"

/** Called only by the explicit offline upgrade helper, after backup and write freeze. */
export async function migrateLegacyPublication(payload: Payload, fingerprint: string) {
  const collection = "site-upgrade-receipts" as any
  // Mongoose may still be creating the new collection/index in the background.
  // Finish that DDL before starting a multi-document transaction.
  const models = (payload.db as any).collections
  for (const slug of ["site-upgrade-receipts", "site-publication-work"]) {
    if (typeof models?.[slug]?.init !== "function")
      throw new Error("The automatic upgrade requires the Mongo adapter")
    await models[slug].init()
  }
  let transientRetries = 0
  while (true) {
    const req = await createLocalReq({ context: { preventHooks: true } }, payload)
    const transactionID = await payload.db.beginTransaction()
    if (!transactionID) throw new Error("Upgrade requires database transactions")
    req.transactionID = transactionID
    try {
      let receipt = (
        await payload.find({
          collection,
          req,
          where: { release: { equals: "4.0.0" } },
          limit: 1,
          pagination: false,
          depth: 0,
          overrideAccess: true,
        })
      ).docs[0] as any
      if (receipt && receipt.fingerprint !== fingerprint)
        throw new Error(
          "Another 4.0 upgrade receipt exists; reconcile its original request before proceeding"
        )
      if (receipt?.status === "completed") {
        await payload.db.commitTransaction(req.transactionID)
        return receipt
      }
      if (!receipt)
        receipt = await payload.create({
          collection,
          req,
          overrideAccess: true,
          data: { release: "4.0.0", fingerprint, status: "running", convertedJobs: [] },
        })
      const jobs = await payload.find({
        collection: "payload-jobs",
        req,
        where: {
          and: [
            { completedAt: { exists: false } },
            { taskSlug: { equals: "dependent-uri-updates" } },
          ],
        },
        sort: "id",
        limit: 25,
        pagination: false,
        depth: 0,
        overrideAccess: true,
      })
      const converted = [...(receipt.convertedJobs || [])]
      let workId = receipt.workId
      if (jobs.docs.length && !workId) {
        // Explicit intent is required even though ordinary content hooks are suppressed.
        const prevent = req.context.preventHooks
        req.context.preventHooks = false
        workId = await queuePublication(req, "routes", "upgrade/4.0.0/legacy-jobs")
        req.context.preventHooks = prevent
      }
      for (const job of jobs.docs) {
        // Preserve historical input/log/default-field absence: the Local API
        // would reapply today's defaults to old records during this status change.
        const completed = await payload.db.updateOne({
          collection: "payload-jobs",
          req,
          where: { and: [
            { id: { equals: job.id } },
            { taskSlug: { equals: "dependent-uri-updates" } },
            { completedAt: { exists: false } },
          ] },
          returning: true,
          data: {
            completedAt: new Date().toISOString(),
            processing: false,
            hasError: false,
          } as any,
        })
        if (!completed) throw new Error(`Legacy job ${job.id} changed during conversion`)
        converted.push({ id: job.id, workId })
      }
      receipt = await payload.update({
        collection,
        id: receipt.id,
        req,
        overrideAccess: true,
        data: {
          workId,
          convertedJobs: converted,
          status: jobs.docs.length < 25 ? "completed" : "running",
        },
      })
      await payload.db.commitTransaction(req.transactionID)
      transientRetries = 0
      if (receipt.status === "completed") return receipt
    } catch (error) {
      await payload.db.rollbackTransaction(req.transactionID).catch(() => undefined)
      const transient =
        (error as any)?.hasErrorLabel?.("TransientTransactionError") ||
        (error as any)?.hasErrorLabel?.("UnknownTransactionCommitResult")
      if (transient && transientRetries++ < 5) {
        await new Promise(resolve => setTimeout(resolve, 100 * transientRetries))
        continue
      }
      throw error
    }
  }
}
