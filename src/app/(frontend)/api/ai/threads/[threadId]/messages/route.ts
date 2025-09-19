import { getSmartSiteConfig } from "@/admin/config"
import { getAIBackendStatus } from "@/admin/lib/ai/status"
import { NextRequest } from "next/server"

/*************************************************************************/
/*  THREAD MESSAGES PROXY
/*************************************************************************/

export async function GET(req: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
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

    const url = new URL(req.url)
    const last = url.searchParams.get("last") || "50"

    const upstream = await fetch(`${aiConfig.endpoint}/api/threads/${threadId}/messages?last=${last}`, {
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
    console.error("Thread messages error:", error)
    return new Response("AI service temporarily unavailable", { status: 500 })
  }
}
