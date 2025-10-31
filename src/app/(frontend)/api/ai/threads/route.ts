import { getSmartSiteConfig } from "@/admin/config"
import { getAIBackendStatus } from "@/admin/lib/ai/status"
import { resolveAIRequestCredentials } from "@/admin/lib/ai/identity"
import { NextRequest } from "next/server"

export const dynamic = "force-dynamic"

/*************************************************************************/
/*  THREADS PROXY (LIST/CREATE)
/*************************************************************************/

export async function GET(req: NextRequest) {
  try {
    const status = await getAIBackendStatus()
    if (!status.enabled) return new Response("AI disabled", { status: 503 })

    const config = getSmartSiteConfig()
    const aiConfig = config.features.ai

    const credentials = await resolveAIRequestCredentials()
    if (!credentials) throw new Error("Missing AI credentials")
    const { apiKey, siteId } = credentials

    const url = new URL(req.url)
    const page = url.searchParams.get("page") || "0"
    const perPage = url.searchParams.get("perPage") || "25"

    const upstream = await fetch(`${aiConfig.endpoint}/api/threads?page=${page}&perPage=${perPage}` as string, {
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
    console.error("Threads proxy GET error:", error)
    return new Response("AI service temporarily unavailable", { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const status = await getAIBackendStatus()
    if (!status.enabled) return new Response("AI disabled", { status: 503 })

    const config = getSmartSiteConfig()
    const aiConfig = config.features.ai
    if (!aiConfig.enabled) return new Response("AI disabled", { status: 503 })

    const credentials = await resolveAIRequestCredentials()
    if (!credentials) throw new Error("Missing AI credentials")
    const { apiKey, siteId } = credentials

    const body = await req.text()

    const upstream = await fetch(`${aiConfig.endpoint}/api/threads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Site-ID": siteId,
      },
      body,
    })

    if (upstream.status === 401 || upstream.status === 403) {
      await getAIBackendStatus(true)
      return new Response("AI disabled", { status: 503 })
    }

    return upstream
  } catch (error) {
    console.error("Threads proxy POST error:", error)
    return new Response("AI service temporarily unavailable", { status: 500 })
  }
}
