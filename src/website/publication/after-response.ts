import { userHasMinimumRole } from "@/access/roles"
import config from "@payload-config"
import { getPayload } from "payload"
import { drainPublication } from "@/website/publication/runner"
import { deliverPublicationCache } from "@/website/publication/cache-delivery"

export function withPublicationDrain<T extends (...args: any[]) => Promise<Response>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    const response = await handler(...args)
    // Materialise MCP's finite response before draining its committed writes.
    const body = await response.arrayBuffer()
    if (response.ok) {
      const payload = await getPayload({ config })
      const { user } = await payload.auth({ headers: args[0].headers })
      if (userHasMinimumRole(user, "editor"))
        await drainPublication(payload, deliverPublicationCache).catch(error =>
          payload.logger.error({ err: error }, "Publication remains pending")
        )
    }
    return new Response([204, 205, 304].includes(response.status) ? null : body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    })
  }) as T
}
