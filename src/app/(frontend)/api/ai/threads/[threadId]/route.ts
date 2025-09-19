import { getSmartSiteConfig } from "@/admin/config"
import { getAIBackendStatus } from "@/admin/lib/ai/status"
import { NextRequest } from "next/server"

/*************************************************************************/
/*  THREAD DETAILS PROXY (GET/DELETE)
/*************************************************************************/

export async function GET(_req: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  try {
    const { threadId } = await params
    if (!threadId) return new Response("Missing thread identifier", { status: 400 })

    const status = await getAIBackendStatus()
    if (!status.enabled) return new Response("AI disabled", { status: 503 })

    const config = getSmartSiteConfig()
    const aiConfig = config.features.ai
    const apiKey = process.env.AI_AGENT_API_KEY
    const siteId = process.env.AI_AGENT_USER_ID
    if (!apiKey || !siteId) throw new Error("Missing AI credentials")

    const upstream = await fetch(`${aiConfig.endpoint}/api/threads/${threadId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-Site-ID": siteId,
      },
      cache: "no-store",
    })

    if (upstream.status === 401 || upstream.status === 403) {
      await getAIBackendStatus(true)
      return new Response("AI disabled", { status: 503 })
    }

    return upstream
  } catch (error) {
    console.error("Thread fetch error:", error)
    return new Response("AI service temporarily unavailable", { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  try {
    const { threadId } = await params
    if (!threadId) return new Response("Missing thread identifier", { status: 400 })

    const status = await getAIBackendStatus()
    if (!status.enabled) return new Response("AI disabled", { status: 503 })

    const config = getSmartSiteConfig()
    const aiConfig = config.features.ai
    const apiKey = process.env.AI_AGENT_API_KEY
    const siteId = process.env.AI_AGENT_USER_ID
    if (!apiKey || !siteId) throw new Error("Missing AI credentials")

    const upstream = await fetch(`${aiConfig.endpoint}/api/threads/${threadId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-Site-ID": siteId,
      },
    })

    if (upstream.status === 401 || upstream.status === 403) {
      await getAIBackendStatus(true)
      return new Response("AI disabled", { status: 503 })
    }

    return upstream
  } catch (error) {
    console.error("Thread delete error:", error)
    return new Response("AI service temporarily unavailable", { status: 500 })
  }
}
