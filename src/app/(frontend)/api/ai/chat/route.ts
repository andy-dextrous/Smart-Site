import { getSmartSiteConfig } from "@/admin/config"
import { getAIBackendStatus } from "@/admin/lib/ai/status"
import { resolveAIRequestCredentials } from "@/admin/lib/ai/identity"
import { NextRequest } from "next/server"

export const maxDuration = 120

/*************************************************************************/
/*  AI CHAT STREAMING ENDPOINT 
/*************************************************************************/

export async function POST(req: NextRequest) {
  try {
    const status = await getAIBackendStatus()
    if (!status.enabled) {
      return new Response("AI features are disabled", { status: 503 })
    }

    const body = await req.json()

    const config = getSmartSiteConfig()
    const aiConfig = config.features.ai

    const credentials = await resolveAIRequestCredentials()
    if (!credentials) {
      throw new Error("Missing AI credentials")
    }
    const { apiKey, siteId } = credentials

    const upstream = await fetch(`${aiConfig.endpoint}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Site-ID": siteId,
      },
      body: JSON.stringify(body),
    })

    if (upstream.status === 401 || upstream.status === 403) {
      await getAIBackendStatus(true)
      return new Response("AI features are disabled", { status: 503 })
    }

    return upstream
  } catch (error) {
    console.error("AI chat proxy error:", error)
    return new Response("AI service temporarily unavailable", { status: 500 })
  }
}
