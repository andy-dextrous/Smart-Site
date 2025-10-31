/*************************************************************************/
/*  SMART SITE AI STATUS LOOKUP
/*************************************************************************/

import { getSmartSiteConfig } from "@/admin/config"
import { getAIAgentUserId } from "./identity"

export type AIWorkspaceState =
  | "active"
  | "pending"
  | "inactive"
  | "suspended"
  | "unauthorized"
  | "error"

interface AIBackendStatus {
  enabled: boolean
  reason: string | null
  status: AIWorkspaceState
  validUntil: string | null
}

const CACHE_TTL_MS = 15000
export const STATUS_PATH = "/api/internal/sites/status"

let cachedStatus: { value: AIBackendStatus; expiresAt: number } | null = null

function deriveStatus(
  enabled: boolean,
  reason: string | null,
  rawStatus: unknown
): AIWorkspaceState {
  if (typeof rawStatus === "string" && rawStatus.length > 0) {
    const lowered = rawStatus.toLowerCase()
    if (lowered.includes("active")) return "active"
    if (lowered.includes("pending")) return "pending"
    if (lowered.includes("suspend")) return "suspended"
    if (lowered.includes("unauthor")) return "unauthorized"
  }

  if (enabled) {
    return "active"
  }

  const normalizedReason = reason?.toLowerCase() ?? ""
  if (normalizedReason.includes("pending")) return "pending"
  if (normalizedReason.includes("suspend")) return "suspended"
  if (normalizedReason.includes("unauthor")) return "unauthorized"

  return "inactive"
}

function store(value: AIBackendStatus): AIBackendStatus {
  cachedStatus = { value, expiresAt: Date.now() + CACHE_TTL_MS }
  return value
}

export async function getAIBackendStatus(force = false): Promise<AIBackendStatus> {
  const now = Date.now()
  if (!force && cachedStatus && cachedStatus.expiresAt > now) {
    return cachedStatus.value
  }

  const config = getSmartSiteConfig()
  if (!config.features.ai.enabled) {
    return store({
      enabled: false,
      reason: "feature-disabled",
      status: "inactive",
      validUntil: null,
    })
  }

  const apiKey = process.env.AI_AGENT_API_KEY?.trim()
  if (!apiKey) {
    return store({
      enabled: false,
      reason: "credentials-missing",
      status: "inactive",
      validUntil: null,
    })
  }

  const siteId = await getAIAgentUserId()
  if (!siteId) {
    return store({
      enabled: false,
      reason: "ai-agent-missing",
      status: "inactive",
      validUntil: null,
    })
  }

  const base = process.env.SMARTSITE_AI_ENDPOINT?.trim() || config.features.ai.endpoint
  if (!base) {
    return store({
      enabled: false,
      reason: "endpoint-missing",
      status: "inactive",
      validUntil: null,
    })
  }

  let target: string
  try {
    target = new URL(STATUS_PATH, base).toString()
  } catch {
    return store({
      enabled: false,
      reason: "endpoint-invalid",
      status: "error",
      validUntil: null,
    })
  }

  try {
    const response = await fetch(target, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-Site-ID": siteId,
      },
      cache: "no-store",
    })

    if (response.status === 401) {
      return store({
        enabled: false,
        reason: "unauthorized",
        status: "unauthorized",
        validUntil: null,
      })
    }

    if (!response.ok) {
      const status = response.status === 423 ? "suspended" : "error"
      return store({
        enabled: false,
        reason: `upstream-${response.status}`,
        status,
        validUntil: null,
      })
    }

    const data = await response.json().catch(() => ({}))
    const enabled = Boolean(data?.enabled)
    const reason = typeof data?.reason === "string" ? data.reason : null
    const validUntil = typeof data?.validUntil === "string" ? data.validUntil : null
    const status = deriveStatus(enabled, reason, data?.status)

    return store({ enabled, reason, status, validUntil })
  } catch (error) {
    return store({
      enabled: false,
      reason: "network-error",
      status: "error",
      validUntil: null,
    })
  }
}
