import { exerciseSearchPublication } from "../../../../tests/fixtures/search-publication"
import { exerciseUnroutedProfile } from "../../../../tests/fixtures/unrouted-profile"
import config from "@payload-config"
import { createLocalReq, getPayload } from "payload"
import { workAsyncStorage } from "next/dist/server/app-render/work-async-storage.external"
import { drainPublication, publicationStatus } from "@/lib/publication/runner"
import { deliverPublicationCache } from "@/lib/publication/cache-delivery"

// Independent fixture-only fault injection. Never shipped.
export const dynamic = "force-dynamic"
export async function POST(request: Request) {
  if (
    process.env.SMARTSITE_ENVIRONMENT !== "local" ||
    !process.env.CRON_SECRET?.trim() ||
    request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  )
    return new Response(null, { status: 403 })
  const payload = await getPayload({ config })
  const input = await request.json()
  if (input.action === "scheduled-queue") {
    const job = await payload.jobs.queue({
      task: input.task,
      queue: input.queue,
      input: input.input,
      ...(input.waitUntil ? { waitUntil: new Date(input.waitUntil) } : {}),
    })
    return Response.json({ id: job.id })
  }
  if (input.action === "prepare") {
    const scope = globalThis as any
    clearInterval(scope[Symbol.for("smartsite.publication.poller")])
    await drainPublication(payload, deliverPublicationCache, 20000)
    return Response.json({ ready: true })
  }
  if (input.action === "search-publication")
    return Response.json(
      await exerciseSearchPublication(payload, deliverPublicationCache, input)
    )
  if (input.action === "unrouted-profile")
    return Response.json(await exerciseUnroutedProfile(payload, deliverPublicationCache))
  const req = await createLocalReq({}, payload)
  if (input.action === "create") {
    const doc = await payload.create({
      collection: "pages",
      req,
      overrideAccess: true,
      data: {
        title: "Independent cache probe",
        slug: "independent-cache-probe",
        _status: "published",
        sections: [{ blockType: "hero", heading: "INDEPENDENT OLD HEADING" }],
      },
    })
    await drainPublication(payload, deliverPublicationCache, 20000)
    return Response.json({ id: doc.id })
  }
  if (input.action === "edit") {
    await payload.update({
      collection: "pages",
      id: input.id,
      req,
      overrideAccess: true,
      data: { sections: [{ blockType: "hero", heading: "INDEPENDENT NEW HEADING" }] },
    })
    return Response.json({ ids: req.context.publicationWorkIds })
  }
  const store = workAsyncStorage.getStore()!
  const cache = store.incrementalCache!
  const original = cache.revalidateTag.bind(cache)
  if (input.action === "mcp-cache-failure") {
    // The real MCP request gets its own Next cache instance. Intercept the shared
    // implementation only while forwarding this isolated fixture request.
    const prototype = Object.getPrototypeOf(cache)
    const originalBackend = prototype.revalidateTag
    let called = 0
    prototype.revalidateTag = async () => {
      called++
      const active = workAsyncStorage.getStore()
      if (active) active.pendingRevalidatedTags = []
      throw new Error("INDEPENDENT MCP cache backend rejection")
    }
    try {
      const response = await fetch(new URL("/api/mcp", request.url), {
        method: "POST",
        headers: {
          authorization: `Bearer ${input.mcpKey}`,
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name: "smartsiteSave", arguments: input.operation },
        }),
        signal: AbortSignal.timeout(60000),
      })
      return Response.json({
        called,
        status: response.status,
        body: await response.text(),
      })
    } finally {
      prototype.revalidateTag = originalBackend
    }
  }
  if (input.action === "reject-cache") {
    let called = 0
    cache.revalidateTag = async () => {
      called++
      throw new Error("INDEPENDENT injected cache backend rejection")
    }
    try {
      await drainPublication(payload, deliverPublicationCache, 10000)
      const status = await publicationStatus(payload, input.ids)
      return Response.json({ called, status })
    } finally {
      cache.revalidateTag = original
      // Prevent Next's automatic second flush from undoing this deliberate failed delivery.
      store.pendingRevalidatedTags = []
    }
  }
  if (input.action === "ack-order") {
    let entered!: () => void
    const started = new Promise<void>(resolve => {
      entered = resolve
    })
    let release!: () => void
    const gate = new Promise<void>(resolve => {
      release = resolve
    })
    let delivered = false
    cache.revalidateTag = async (...args: Parameters<typeof original>) => {
      entered()
      await gate
      await original(...args)
      delivered = true
    }
    try {
      const draining = drainPublication(payload, deliverPublicationCache, 15000)
      await started
      const before = await publicationStatus(payload, input.ids)
      const prematureCompletion = before.work.some(work => work.status === "completed")
      release()
      await draining
      return Response.json({
        prematureCompletion,
        delivered,
        before,
        after: await publicationStatus(payload, input.ids),
      })
    } finally {
      cache.revalidateTag = original
    }
  }
  return Response.json({ error: "unknown fixture probe" }, { status: 400 })
}
