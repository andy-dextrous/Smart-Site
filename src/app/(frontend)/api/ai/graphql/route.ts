import { unstable_cache } from "next/cache"
import crypto from "crypto"
import { getAIAgentUserId } from "@/admin/lib/ai/identity"

export async function POST(request: Request) {
  /**
   * Extract and validate API key
   */
  const auth = request.headers.get("Authorization") || ""
  const apiKey = auth.replace(/^Bearer\s+/i, "")
  if (!apiKey || apiKey !== process.env.AI_AGENT_API_KEY) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  /**
   * Parse body safely
   */
  let body: any
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  const { query, variables, preview } = body || {}

  /**
   * Optional: bypass cache in preview mode
   */
  if (preview) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `users API-Key ${process.env.AI_AGENT_API_KEY}`,
      },
      body: JSON.stringify({ query, variables }),
    })
    const data = await res.json().catch(() => ({ error: "Upstream error" }))
    return Response.json(data, { status: res.ok ? 200 : res.status })
  }

  /**
   * Build cache key from query + variables
   */
  const queryHash = crypto
    .createHash("sha256")
    .update(JSON.stringify({ query, variables }))
    .digest("hex")
    .substring(0, 16)

  const siteId = await getAIAgentUserId()
  if (!siteId) {
    return Response.json({ error: "AI agent identity missing" }, { status: 500 })
  }
  const cacheKey = [siteId, queryHash]
  const tags = [`site:${siteId}`, `query:${queryHash}`]

  /**
   * Use Next.js cache for 30 minutes
   */
  const data = await unstable_cache(
    async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `users API-Key ${process.env.AI_AGENT_API_KEY}`,
        },
        body: JSON.stringify({ query, variables }),
      })
      if (!res.ok) {
        const text = await res.text().catch(() => "")
        throw new Error(`GraphQL failed (${res.status}): ${text || res.statusText}`)
      }
      return res.json()
    },
    cacheKey,
    { tags, revalidate: 1800 }
  )()

  return Response.json(data)
}
