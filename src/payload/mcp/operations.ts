import { drainPublication, publicationStatus } from "@/lib/publication/runner"
import {
  deliverPublicationCache,
  hasPublicationCacheContext,
} from "@/lib/publication/cache-delivery"
import { userHasMinimumRole } from "@/payload/access/roles"
import { createHash } from "node:crypto"
import { APIError, type PayloadRequest } from "payload"
import { projectContentResponse } from "@/payload/mcp/projection"
import { contentTarget, revision } from "@/payload/mcp/contracts"

const json = (value: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(value) }],
})
export function operationKey(req: PayloadRequest, operationId: unknown) {
  if (!req.user || typeof operationId !== "string")
    throw new APIError("Authenticated operationId required", 403)
  return createHash("sha256")
    .update(`${req.context.smartsiteKeyId}:${req.user.id}:${operationId}`)
    .digest("hex")
}
async function receipt(req: PayloadRequest, operationId: unknown) {
  const found = await req.payload.find({
    collection: "smartsite-operations" as any,
    where: { operationKey: { equals: operationKey(req, operationId) } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  })
  return found.docs[0] as any
}
async function visibleResult(req: PayloadRequest, result: any) {
  if (!result?.target || !result.document)
    throw new APIError("Receipt is unavailable", 404)
  // Recheck record access NOW, not only the access that held when it was saved.
  if (contentTarget(result.target, req.payload.config) === "global")
    await req.payload.findGlobal({
      slug: result.target,
      req,
      overrideAccess: false,
      depth: 0,
    })
  else
    await req.payload.findByID({
      collection: result.target,
      id: result.document.id,
      req,
      overrideAccess: false,
      depth: 0,
      draft: true,
    })
  return {
    ...result,
    document: await projectContentResponse(req, result.target, result.document),
    ...(result.publicationWorkIds
      ? { publication: await publicationStatus(req.payload, result.publicationWorkIds) }
      : {}),
  }
}
export async function operationStatus(
  args: Record<string, unknown>,
  req: PayloadRequest
) {
  if (!userHasMinimumRole(req.user, "editor"))
    throw new APIError("Website editor account required", 403)
  const existing = await receipt(req, args.operationId)
  if (existing)
    return json({
      operationId: args.operationId,
      status: "committed",
      result: await visibleResult(req, existing.result),
    })
  const pending = await req.payload.find({
    collection: "smartsite-uploads" as any,
    where: { operationKey: { equals: operationKey(req, args.operationId) } },
    limit: 1,
    overrideAccess: true,
    req,
  })
  return json({
    operationId: args.operationId,
    status: pending.docs.length ? "storage-pending" : "unknown",
    ...(pending.docs.length
      ? {
          next: "Inspect the owned upload reservation and storage files before retrying; do not start another upload.",
        }
      : {}),
  })
}
export async function withOperation(
  args: Record<string, unknown>,
  req: PayloadRequest,
  run: (
    args: Record<string, unknown>,
    req: PayloadRequest
  ) => Promise<ReturnType<typeof json>>
) {
  if (!userHasMinimumRole(req.user, "editor"))
    throw new APIError("Website editor account required", 403)
  const fingerprint = revision(args)
  const prior = await receipt(req, args.operationId)
  if (prior) {
    if (prior.fingerprint !== fingerprint)
      throw new APIError("operationId was already used with different input", 409)
    return json({
      ...(await visibleResult(req, prior.result)),
      operationId: args.operationId,
      replayed: true,
    })
  }
  const transactionID = await req.payload.db.beginTransaction()
  if (!transactionID)
    throw new APIError("A transaction-capable database is required", 503)
  const tx = {
    ...req,
    context: {
      ...req.context,
      disableRevalidate: true,
      smartsiteAfterCommit: [],
      // Payload shallow-copies request context for nested Local API operations.
      // Initialize once so every hook appends to the same operation-owned array.
      publicationWorkIds: [],
    },
    transactionID,
  } as PayloadRequest
  let result: any
  try {
    result = { ...JSON.parse((await run(args, tx)).content[0].text), target: args.target }
    result.publicationWorkIds = [...((tx.context.publicationWorkIds || []) as string[])]
    await req.payload.create({
      collection: "smartsite-operations" as any,
      data: { operationKey: operationKey(req, args.operationId), fingerprint, result },
      overrideAccess: true,
      req: tx,
    })
    await req.payload.db.commitTransaction(transactionID)
  } catch (error) {
    await req.payload.db.rollbackTransaction(transactionID).catch(() => undefined)
    // Do not replay stale patches. A concurrent winner can be reconciled via status.
    if ((error as any)?.code === 112 || (error as any)?.code === 11000)
      throw new APIError(
        "Concurrent operation conflict. Read operation status, then current content before reconciling.",
        409
      )
    throw error
  }
  const warnings: string[] = []
  for (const refresh of (tx.context.smartsiteAfterCommit as Array<
    () => Promise<unknown>
  >) ?? []) {
    try {
      await refresh()
    } catch {
      if (!warnings.length)
        warnings.push(
          "Content committed; preview refresh failed. Verify the page without repeating the write."
        )
    }
  }
  if (hasPublicationCacheContext())
    await drainPublication(req.payload, deliverPublicationCache).catch(() => undefined)
  const publication = await publicationStatus(req.payload, result.publicationWorkIds)
  if (publication.work.some(work => work.status !== "completed"))
    warnings.push(
      "Content committed; website refresh remains pending. Check operation status; do not repeat the save."
    )
  return json({
    ...result,
    publication,
    operationId: args.operationId,
    committed: true,
    warnings,
  })
}
