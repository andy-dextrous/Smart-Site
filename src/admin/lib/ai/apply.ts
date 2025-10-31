import { getPayload } from "payload"
import type { Payload } from "payload"
import config from "@payload-config"

import { getSmartSiteConfig } from "@/admin/config"
import { getAIBackendStatus, type AIWorkspaceState } from "@/admin/lib/ai/status"
import { getAIAgentUserId } from "@/admin/lib/ai/identity"

const APPLY_PATH = "/api/internal/sites/apply"

export interface ApplyRequester {
  id: number | string
  email: string
  name?: string | null
}

export function resolveSiteUrl(): string {
  const candidates = [process.env.NEXT_PUBLIC_SITE_URL, process.env.NEXT_PUBLIC_URL]

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim()
    }
  }

  return "http://localhost:3000"
}

export function resolveApplyEndpoint(): string | null {
  const smartSiteConfig = getSmartSiteConfig()
  const base = process.env.SMARTSITE_AI_ENDPOINT?.trim() || smartSiteConfig.features.ai.endpoint?.trim()
  if (!base) {
    return null
  }

  const path = smartSiteConfig.features.ai.registrationPath?.trim() || APPLY_PATH

  try {
    return new URL(path.startsWith("/") ? path : `/${path}`, base).toString()
  } catch {
    return null
  }
}

async function resolveSiteName(payload: Payload): Promise<string> {
  try {
    const settings = await payload.findGlobal({ slug: "settings", depth: 0 })
    const maybeName = (settings as any)?.general?.siteName ?? (settings as any)?.siteName
    if (typeof maybeName === "string" && maybeName.trim().length > 0) {
      return maybeName.trim()
    }
  } catch {
    // ignore lookup failure
  }
  return "Smart Site"
}

export class AIApplyError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

export async function submitAIWorkspaceApplication(
  requester: ApplyRequester,
  options: { payload?: Payload } = {}
): Promise<{
  status: AIWorkspaceState
  enabled: boolean
  reason: string | null
  validUntil: string | null
}> {
  const payload = options.payload ?? (await getPayload({ config }))

  const apiKey = process.env.AI_AGENT_API_KEY?.trim()
  if (!apiKey) {
    throw new AIApplyError("AI agent API key is missing. Run the seed or register command.", 400)
  }

  const siteId = await getAIAgentUserId({ payload })
  if (!siteId) {
    throw new AIApplyError("AI agent user not found. Run the seed or register command.", 400)
  }

  const endpoint = resolveApplyEndpoint()
  if (!endpoint) {
    throw new AIApplyError("Smart Site AI endpoint is not configured.", 500)
  }

  const siteUrl = resolveSiteUrl()
  const siteName = await resolveSiteName(payload)

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Site-ID": siteId,
      },
      body: JSON.stringify({
        siteId,
        siteName,
        siteUrl,
        requester: {
          id: requester.id,
          email: requester.email,
          name: requester.name ?? requester.email,
        },
      }),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => "")
      const status = response.status === 401 ? 401 : 502
      throw new AIApplyError(text || response.statusText || "Smart Site AI apply request failed", status)
    }
  } catch (error) {
    if (error instanceof AIApplyError) {
      throw error
    }
    throw new AIApplyError(
      error instanceof Error ? error.message : "Unable to reach Smart Site AI endpoint",
      502
    )
  }

  return getAIBackendStatus(true)
}
