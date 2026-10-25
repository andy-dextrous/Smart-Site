import { userHasMinimumRole } from "@/payload/access/roles"
import config from "@payload-config"
import { getPayload } from "payload"
import { canRunPublication } from "@/lib/publication/access"
import { drainPublication, publicationStatus } from "@/lib/publication/runner"
import { deliverPublicationCache } from "@/lib/publication/cache-delivery"
import { runScheduledPublishing } from "@/payload/jobs/run-scheduled"
export const dynamic = "force-dynamic"
export const maxDuration = 60

async function authorized(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  return canRunPublication({ user, headers: request.headers }) ? payload : null
}
export async function GET(request: Request) {
  if (new URL(request.url).searchParams.has("status")) {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: request.headers })
    if (!userHasMinimumRole(user, "editor"))
      return Response.json({ error: "Editor authentication required" }, { status: 403 })
    const status = await publicationStatus(payload)
    return Response.json(
      userHasMinimumRole(user, "admin")
        ? status
        : {
            total: status.total,
            work: status.work.map(work => ({ status: work.status })),
          }
    )
  }
  const payload = await authorized(request)
  if (!payload)
    return Response.json(
      { error: "Administrator or runner authentication required" },
      { status: 403 }
    )
  // Native scheduled publishes use their original user's Payload permissions.
  // Always drain already committed work, including when a native task failed.
  const scheduled = await runScheduledPublishing(payload)
  await drainPublication(payload, deliverPublicationCache, 4000)
  return Response.json(
    { ...(await publicationStatus(payload)), scheduled },
    { status: scheduled.failed || scheduled.infrastructureError ? 503 : 200 }
  )
}
export async function POST(request: Request) {
  const payload = await authorized(request)
  if (!payload)
    return Response.json(
      { error: "Administrator or runner authentication required" },
      { status: 403 }
    )
  const input = await request.json().catch(() => ({}))
  if (input.retryId)
    await payload.db.updateOne({
      collection: "site-publication-work" as any,
      where: {
        and: [{ id: { equals: input.retryId } }, { status: { equals: "failed" } }],
      },
      data: { status: "pending", attempts: 0, error: null },
      returning: true,
    })
  await drainPublication(payload, deliverPublicationCache, 4000)
  return Response.json(await publicationStatus(payload))
}
