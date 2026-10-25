import { reconcileSearchRoute } from "./search-route"
import { isUnroutedDocument } from "@/website/routing/route-eligibility"
import { MAX_PAGE_NODES } from "@/website/routing/limits"
import { createHash } from "node:crypto"
import { randomUUID } from "node:crypto"
import { createLocalReq, type Payload, type PayloadRequest, type Where } from "payload"
import { websiteCollections } from "@/website/collection-metadata"
import { routingEngine } from "@/website/routing/uri-engine"
import { updateURI, getTemplateIdForCollection } from "@/website/routing/index-manager"
import { cleanupAutomaticRedirect } from "@/website/redirects/auto-redirects"

type Work = {
  id: string
  source: string
  kind: string
  status: string
  owner: string
  generation: number
  leaseUntil: string
  attempts: number
  processed: number
  checkpoint?: {
    collection: number
    after?: string
    homeDone?: boolean
    cache?: boolean
    inventory?: string[]
    skipped?: number
    skippedExamples?: string[]
  }
}
const collection = "site-publication-work" as any
const LEASE_MS = 30_000
const BATCH_SIZE = 25
const predicate = (work: Work): Where => ({
  and: [
    { id: { equals: work.id } },
    { owner: { equals: work.owner } },
    { generation: { equals: work.generation } },
    { status: { equals: "running" } },
    { leaseUntil: { greater_than: new Date().toISOString() } },
  ],
})

// The adapter's WHERE-only updateOne is atomic. Passing id here would discard WHERE on Mongo.
export async function claimPublication(
  payload: Payload,
  timeoutMs = 2_000
): Promise<Work | null> {
  if (timeoutMs <= 0) return null
  // A killed Mongo transaction may retain its write lock beyond our lease.
  // Bound the database operation itself; a Promise timeout would leave it running.
  const claimUpdate = async (args: Parameters<Payload["db"]["updateOne"]>[0]) => {
    try {
      return await payload.db.updateOne({
        ...args,
        options: { maxTimeMS: Math.max(1, Math.min(2_000, timeoutMs)) },
      })
    } catch (error: any) {
      if ([50, 24].includes(error?.code) || error?.codeName === "MaxTimeMSExpired")
        return null
      throw error
    }
  }
  const first = await payload.find({
    collection,
    where: { status: { in: ["pending", "running"] } },
    sort: "id",
    limit: 1,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })
  const item = first.docs[0] as unknown as Work | undefined
  if (!item) return null
  const now = new Date().toISOString()
  if (item.status === "running" && item.attempts >= 4) {
    await claimUpdate({
      collection,
      where: {
        and: [
          { id: { equals: item.id } },
          { generation: { equals: item.generation } },
          { status: { equals: "running" } },
          { leaseUntil: { less_than_equal: now } },
        ],
      },
      data: {
        status: "failed",
        attempts: item.attempts + 1,
        error:
          "Publication repeatedly lost its runner. Inspect this work ID and retry after repair.",
        owner: null,
        leaseUntil: null,
      },
      returning: true,
    })
    return null
  }
  const claimed = (await claimUpdate({
    collection,
    where: {
      and: [
        { id: { equals: item.id } },
        { generation: { equals: item.generation } },
        {
          or: [
            { status: { equals: "pending" } },
            {
              and: [
                { status: { equals: "running" } },
                { leaseUntil: { less_than_equal: now } },
              ],
            },
          ],
        },
      ],
    },
    data: {
      status: "running",
      attempts: item.attempts + (item.status === "running" ? 1 : 0),
      owner: randomUUID(),
      generation: item.generation + 1,
      leaseUntil: new Date(Date.now() + LEASE_MS).toISOString(),
    },
    returning: true,
  })) as unknown as Work | null
  // A paused process must never start work with an already expired lease.
  if (claimed && Date.parse(claimed.leaseUntil) <= Date.now()) return null
  return claimed
}

async function reconcileDocument(req: PayloadRequest, slug: string, doc: any) {
  const { uri, breadcrumbs } = await routingEngine.generateURIAndBreadcrumbs({
    collection: slug,
    slug: doc.slug,
    data: doc,
    req,
  })
  if (!uri) throw new Error(`Cannot resolve route for ${slug}/${doc.id}`)
  const templateId = await getTemplateIdForCollection(slug, req.payload, req)
  await updateURI({
    req,
    collection: slug,
    documentId: doc.id,
    uri,
    previousURI: doc.uri,
    templateId: templateId || undefined,
    breadcrumbs,
    data: { ...doc, uri },
    originalDoc: doc,
    status: doc.deletedAt || doc._status === "draft" ? "draft" : "published",
    skipRedirect: doc.uri === "/",
  })
  const derived: Record<string, unknown> = { uri, updatedAt: null }
  if (slug === "pages") {
    const chain: any[] = [doc]
    const seen = new Set([String(doc.id)])
    let parent = typeof doc.parent === "object" ? doc.parent?.id : doc.parent
    while (parent) {
      if (seen.has(String(parent)) || chain.length >= MAX_PAGE_NODES)
        throw new Error("Invalid page hierarchy: cycle or excessive depth")
      seen.add(String(parent))
      const ancestor = await req.payload.findByID({
        req,
        collection: "pages",
        id: parent,
        depth: 0,
        overrideAccess: true,
      })
      chain.unshift(ancestor)
      parent = typeof ancestor.parent === "object" ? ancestor.parent?.id : ancestor.parent
    }
    const stored = []
    for (const item of chain) {
      const url = await routingEngine.generateURI({
        req,
        collection: "pages",
        slug: item.slug,
        data: item,
      })
      stored.push({
        id:
          doc.breadcrumbs?.find(
            (entry: any) => String(entry.doc?.id || entry.doc) === String(item.id)
          )?.id ||
          createHash("sha256").update(`${doc.id}:${item.id}`).digest("hex").slice(0, 24),
        doc: item.id,
        label: item.title,
        url,
      })
    }
    derived.breadcrumbs = stored
  }
  await req.payload.db.updateOne({
    req,
    collection: slug as any,
    where: { id: { equals: doc.id } },
    data: derived,
    returning: true,
  })
  await reconcileSearchRoute(req, slug, doc, uri)
  if (doc.uri === "/" && uri !== "/") await cleanupAutomaticRedirect("/", req)
}

export async function processPublicationBatch(
  payload: Payload,
  work: Work
): Promise<Work> {
  const transactionID = await payload.db.beginTransaction()
  if (!transactionID) throw new Error("Publication requires database transactions")
  const req = await createLocalReq(
    {
      context: {
        preventHooks: true,
        publicationWorker: true,
        disableRevalidate: true,
        smartsiteAfterCommit: [],
      },
    },
    payload
  )
  req.transactionID = transactionID
  try {
    const owned = await payload.db.updateOne({
      collection,
      where: predicate(work),
      data: { leaseUntil: work.leaseUntil },
      req,
      returning: true,
    })
    if (!owned) throw new Error("Publication lease lost")
    const collections = websiteCollections(payload.config).map(c => c.slug)
    const checkpoint = { collection: 0, ...work.checkpoint }
    if (JSON.stringify(checkpoint.inventory) !== JSON.stringify(collections)) {
      checkpoint.collection = 0
      delete checkpoint.after
      checkpoint.homeDone = false
      checkpoint.cache = false
      checkpoint.inventory = collections
      checkpoint.skipped = 0
      checkpoint.skippedExamples = []
    }
    let processed = work.processed
    {
      // Demote the former homepage before assigning its unique '/' URI to the new one.
      const settings = await payload.findGlobal({
        slug: "settings",
        req,
        depth: 0,
        overrideAccess: true,
      })
      const home = (settings as any).routing?.homepage
      const homeId = typeof home === "object" ? home?.id : home
      const old = await payload.find({
        collection: "uri-index",
        req,
        where: { uri: { equals: "/" } },
        limit: 1,
        overrideAccess: true,
        depth: 0,
      })
      const indexed = old.docs[0]
      if (
        indexed?.sourceCollection === "pages" &&
        String(indexed.documentId) !== String(homeId)
      ) {
        const doc = await payload.findByID({
          collection: "pages",
          id: indexed.documentId,
          req,
          trash: true,
          depth: 0,
          overrideAccess: true,
        })
        await reconcileDocument(req, "pages", doc)
      }
      checkpoint.homeDone = true
    }
    const slug = collections[checkpoint.collection]
    if (slug) {
      const published = payload.collections[slug as keyof typeof payload.collections]
        .config.versions?.drafts
        ? [{ _status: { equals: "published" } }]
        : []
      const result = await payload.find({
        collection: slug as any,
        req,
        where: {
          and: [
            ...published,
            ...(checkpoint.after ? [{ id: { greater_than: checkpoint.after } }] : []),
          ],
        },
        sort: "id",
        limit: BATCH_SIZE,
        depth: 0,
        overrideAccess: true,
        pagination: false,
      })
      for (const doc of result.docs) {
        if (await isUnroutedDocument({ req, collection: slug, data: doc })) {
          checkpoint.skipped = (checkpoint.skipped || 0) + 1
          checkpoint.skippedExamples ||= []
          if (checkpoint.skippedExamples.length < 10)
            checkpoint.skippedExamples.push(`${slug}/${doc.id}`)
        } else {
          await reconcileDocument(req, slug, doc)
          processed++
        }
      }
      if (result.docs.length < BATCH_SIZE) {
        checkpoint.collection++
        delete checkpoint.after
      } else checkpoint.after = String(result.docs.at(-1)!.id)
    }
    checkpoint.cache = checkpoint.collection >= collections.length
    const updated = await payload.db.updateOne({
      collection,
      where: predicate(work),
      data: {
        checkpoint,
        processed,
        leaseUntil: new Date(Date.now() + LEASE_MS).toISOString(),
      },
      req,
      returning: true,
    })
    if (!updated) throw new Error("Publication lease expired during batch")
    await payload.db.commitTransaction(transactionID)
    if ((checkpoint.skipped || 0) > (work.checkpoint?.skipped || 0))
      payload.logger.info(
        {
          workId: work.id,
          skipped: checkpoint.skipped,
          examples: checkpoint.skippedExamples,
        },
        "Preserved content records without individual website routes"
      )
    return updated as unknown as Work
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID).catch(() => undefined)
    throw error
  }
}

/** Only the authenticated Next route supplies a cache-delivery implementation. */
export async function drainPublication(
  payload: Payload,
  deliverCache: () => Promise<void>,
  budgetMs = 1500
) {
  const deadline = Date.now() + budgetMs
  let completed = 0
  while (Date.now() < deadline) {
    let work = await claimPublication(payload, deadline - Date.now())
    if (!work) break
    try {
      while (work.kind === "routes" && !work.checkpoint?.cache && Date.now() < deadline)
        work = await processPublicationBatch(payload, work)
      if (work.kind === "refresh" || work.checkpoint?.cache) {
        await deliverCache()
        const saved = await payload.db.updateOne({
          collection,
          where: predicate(work),
          data: {
            status: "completed",
            cacheAcknowledgedAt: new Date().toISOString(),
            error: null,
            owner: null,
            leaseUntil: null,
          },
          returning: true,
        })
        if (saved) completed++
      } else {
        await payload.db.updateOne({
          collection,
          where: predicate(work),
          data: { status: "pending", owner: null, leaseUntil: null },
          returning: true,
        })
      }
    } catch (error) {
      payload.logger.error(
        { err: error, workId: work.id },
        "Content is saved; publication work remains unfinished"
      )
      await payload.db.updateOne({
        collection,
        where: predicate(work),
        data: {
          status: work.attempts + 1 >= 5 ? "failed" : "pending",
          attempts: work.attempts + 1,
          error:
            "Publication failed. Inspect the server log using this work ID, repair the cause, then retry.",
          owner: null,
          leaseUntil: null,
        },
        returning: true,
      })
      break
    }
  }
  return { completed }
}

export async function publicationStatus(payload: Payload, ids?: string[]) {
  const where: Where = ids ? { id: { in: ids } } : { status: { not_equals: "completed" } }
  const result = await payload.find({
    collection,
    where,
    sort: "id",
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })
  return {
    total: result.totalDocs,
    work: result.docs.map((doc: any) => ({
      id: doc.id,
      status: doc.status,
      source: doc.source,
      processed: doc.processed,
      skipped: doc.checkpoint?.skipped || 0,
      skippedExamples: doc.checkpoint?.skippedExamples || [],
      attempts: doc.attempts,
      error: doc.error,
      cacheAcknowledgedAt: doc.cacheAcknowledgedAt,
    })),
  }
}
