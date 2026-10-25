import type { PayloadRequest } from "payload"

/** The original request is essential: content and its recovery record commit together. */
export async function queuePublication(
  req: PayloadRequest,
  kind: "routes" | "refresh",
  source: string
) {
  if (req.context.preventHooks || req.context.publicationWorker) return
  const work = await req.payload.create({
    collection: "site-publication-work" as any,
    req,
    overrideAccess: true,
    data: { kind, source, status: "pending", generation: 0, attempts: 0, processed: 0 },
  })
  const ids = (req.context.publicationWorkIds ||= []) as string[]
  ids.push(String(work.id))
  return String(work.id)
}
