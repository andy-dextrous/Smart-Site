import { getServerSideURL } from "@/lib/get-url"

const SAFE_FETCH_SITES = new Set(["same-origin", "same-site", "none"])

export interface RequestGuardResult {
  valid: boolean
  message?: string
}

function normalizeHost(url: string): string | null {
  try {
    const parsed = new URL(url)
    return parsed.host
  } catch {
    return null
  }
}

export function validateSameOriginRequest(headers: Headers): RequestGuardResult {
  const originHeader = headers.get("origin")

  if (originHeader && originHeader !== "null") {
    const requestHost = normalizeHost(originHeader)
    const allowedHost = normalizeHost(getServerSideURL())

    if (!requestHost || !allowedHost || requestHost !== allowedHost) {
      return {
        valid: false,
        message: "Origin mismatch",
      }
    }
  } else {
    const fetchSite = headers.get("sec-fetch-site")

    if (fetchSite && !SAFE_FETCH_SITES.has(fetchSite)) {
      return {
        valid: false,
        message: "Cross-site request blocked",
      }
    }
  }

  return { valid: true }
}
