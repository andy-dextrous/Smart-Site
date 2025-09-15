import { getSmartSiteConfig } from "@/admin/config"
import { NextRequest } from "next/server"

export const maxDuration = 120

/*************************************************************************/
/*  AI CHAT STREAMING ENDPOINT - COMPATIBLE WITH ASSISTANT-UI
/*************************************************************************/

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const config = getSmartSiteConfig()
    const aiConfig = config.features.ai

    if (!aiConfig.enabled) {
      return new Response("AI features are disabled", { status: 503 })
    }

    const apiKey = process.env.AI_AGENT_API_KEY
    const siteId = process.env.AI_AGENT_USER_ID

    if (!apiKey || !siteId) {
      throw new Error("Missing AI credentials in environment variables")
    }

    /**
     * Proxy the request to the AI backend with credentials
     */
    return await fetch(`${aiConfig.endpoint}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Site-ID": siteId,
      },
      body: JSON.stringify(body),
    })
  } catch (error) {
    console.error("AI chat proxy error:", error)
    return new Response("AI service temporarily unavailable", { status: 500 })
  }
}
