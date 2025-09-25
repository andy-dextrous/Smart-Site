import { NextRequest } from "next/server"

import { getSmartSiteConfig } from "@/admin/config"
import { getAIBackendStatus } from "@/admin/lib/ai/status"

export async function POST(req: NextRequest) {
  try {
    const status = await getAIBackendStatus()
    if (!status.enabled) {
      return new Response("AI features are disabled", { status: 503 })
    }

    const config = getSmartSiteConfig()
    const aiConfig = config.features.ai

    const apiKey = process.env.AI_AGENT_API_KEY
    const siteId = process.env.AI_AGENT_USER_ID

    if (!apiKey || !siteId) {
      throw new Error("Missing AI credentials in environment variables")
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      "X-Site-ID": siteId,
    }

    const contentType = req.headers.get("content-type")
    if (contentType) {
      headers["Content-Type"] = contentType
    }

    const upstream = await fetch(`${aiConfig.endpoint}/api/ai/attachments`, {
      method: "POST",
      headers,
      body: req.body,
      // @ts-expect-error Duplex is required for streaming form data in Node fetch
      duplex: "half",
    })

    if (upstream.status === 401 || upstream.status === 403) {
      await getAIBackendStatus(true)
      return new Response("AI features are disabled", { status: 503 })
    }

    const responseHeaders = new Headers()
    upstream.headers.forEach((value, key) => responseHeaders.set(key, value))

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error("AI attachment proxy error:", error)
    return new Response("AI service temporarily unavailable", { status: 500 })
  }
}
