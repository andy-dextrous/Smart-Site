import { getSmartSiteConfig } from "@/admin/config"
import { NextRequest } from "next/server"

export const dynamic = "force-dynamic"

/*************************************************************************/
/*  THREADS PROXY (LIST/CREATE)
/*************************************************************************/

export async function GET(req: NextRequest) {
  try {
    const config = getSmartSiteConfig()
    const aiConfig = config.features.ai
    if (!aiConfig.enabled) return new Response("AI disabled", { status: 503 })

    const apiKey = process.env.AI_AGENT_API_KEY
    const siteId = process.env.AI_AGENT_USER_ID
    if (!apiKey || !siteId) throw new Error("Missing AI credentials")

    const url = new URL(req.url)
    const page = url.searchParams.get("page") || "0"
    const perPage = url.searchParams.get("perPage") || "25"

    return await fetch(`${aiConfig.endpoint}/api/threads?page=${page}&perPage=${perPage}` as string, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-Site-ID": siteId,
      },
      cache: "no-store",
    })
  } catch (error) {
    console.error("Threads proxy GET error:", error)
    return new Response("AI service temporarily unavailable", { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const config = getSmartSiteConfig()
    const aiConfig = config.features.ai
    if (!aiConfig.enabled) return new Response("AI disabled", { status: 503 })

    const apiKey = process.env.AI_AGENT_API_KEY
    const siteId = process.env.AI_AGENT_USER_ID
    if (!apiKey || !siteId) throw new Error("Missing AI credentials")

    const body = await req.text()

    return await fetch(`${aiConfig.endpoint}/api/threads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Site-ID": siteId,
      },
      body,
    })
  } catch (error) {
    console.error("Threads proxy POST error:", error)
    return new Response("AI service temporarily unavailable", { status: 500 })
  }
}
