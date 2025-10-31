import type { Payload } from "payload"
import { getPayload } from "payload"
import config from "@payload-config"

let cachedAIAgentUserId: string | null | undefined

interface ResolveOptions {
  payload?: Payload
  refresh?: boolean
}

export async function getAIAgentUserId(options: ResolveOptions = {}): Promise<string | null> {
  if (!options.refresh && cachedAIAgentUserId !== undefined) {
    return cachedAIAgentUserId
  }

  const client = options.payload ?? (await getPayload({ config }))

  try {
    const result = await client.find({
      collection: "users",
      where: {
        role: {
          equals: "ai-agent",
        },
      },
      limit: 1,
      overrideAccess: true,
      depth: 0,
    })

    const user = result.docs[0]
    const resolved = user ? String(user.id) : null
    cachedAIAgentUserId = resolved
    return resolved
  } catch {
    cachedAIAgentUserId = null
    return null
  }
}

export function invalidateAIAgentUserIdCache() {
  cachedAIAgentUserId = undefined
}

export async function resolveAIRequestCredentials(
  options: ResolveOptions = {}
): Promise<{ apiKey: string; siteId: string } | null> {
  const apiKey = process.env.AI_AGENT_API_KEY?.trim()
  if (!apiKey) {
    return null
  }

  const siteId = await getAIAgentUserId(options)
  if (!siteId) {
    return null
  }

  return { apiKey, siteId }
}
