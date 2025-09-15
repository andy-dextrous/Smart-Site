import { getSmartSiteConfig } from "@/admin/config"
import { NextRequest } from "next/server"

export const dynamic = "force-dynamic"

/*************************************************************************/
/*  THREAD DELETE PROXY
/*************************************************************************/

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ threadId: string }> }
) {
  try {
    const config = getSmartSiteConfig()
    const aiConfig = config.features.ai
    if (!aiConfig.enabled) return new Response("AI disabled", { status: 503 })

    const apiKey = process.env.AI_AGENT_API_KEY
    const siteId = process.env.AI_AGENT_USER_ID
    if (!apiKey || !siteId) throw new Error("Missing AI credentials")

    const { threadId } = await context.params
    if (!threadId) return new Response("Missing thread id", { status: 400 })

    return await fetch(`${aiConfig.endpoint}/api/threads/${threadId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-Site-ID": siteId,
      },
    })
  } catch (error) {
    console.error("Threads proxy DELETE error:", error)
    return new Response("AI service temporarily unavailable", { status: 500 })
  }
}

