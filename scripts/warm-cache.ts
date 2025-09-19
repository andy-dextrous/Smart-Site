import process from "node:process"

type WarmOutcome = {
  url: string
  status: number
  ok: boolean
  error?: string
}

async function main() {
  const baseValue = process.env.BASE_URL
  if (!baseValue) {
    throw new Error("BASE_URL is required")
  }
  const baseUrl = createUrl(baseValue)
  const sitemapIndexUrl = new URL("/sitemap.xml", baseUrl)
  const discoveredUrls = await collectSitemapTargets(sitemapIndexUrl, baseUrl)
  const targets = new Set<string>()
  targets.add(baseUrl.href)
  discoveredUrls.forEach(value => targets.add(value))
  const orderedTargets = Array.from(targets)
  const outcomes: WarmOutcome[] = []
  for (const target of orderedTargets) {
    const outcome = await warmTarget(target)
    outcomes.push(outcome)
  }
  const failed = outcomes.filter(item => !item.ok)
  outcomes.forEach(item => {
    const label = item.ok ? "WARMED" : "FAILED"
    const statusLabel = `${item.status}`
    const message = item.error ? ` ${item.error}` : ""
    console.log(`${label} ${statusLabel} ${item.url}${message}`)
  })
  if (failed.length > 0) {
    const failureSummary = failed.map(item => `${item.url} (${item.status})`).join(", ")
    throw new Error(`Warm up failed for: ${failureSummary}`)
  }
}

function createUrl(value: string): URL {
  try {
    const url = new URL(value)
    if (!url.pathname || url.pathname === "/") {
      url.pathname = "/"
    }
    return url
  } catch (error) {
    throw new Error(`Invalid BASE_URL value: ${value}`)
  }
}

async function collectSitemapTargets(indexUrl: URL, baseUrl: URL): Promise<string[]> {
  const visited = new Set<string>()
  const queue: string[] = [indexUrl.toString()]
  const pageUrls = new Set<string>()
  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) {
      continue
    }
    if (visited.has(current)) {
      continue
    }
    visited.add(current)
    const response = await safeFetch(current)
    if (!response) {
      continue
    }
    const text = await response.text()
    const matches = Array.from(text.matchAll(/<loc>(.*?)<\/loc>/gi))
    for (const match of matches) {
      const raw = match[1]?.trim()
      if (!raw) {
        continue
      }
      const normalized = normalizeUrl(raw, baseUrl)
      if (!normalized) {
        continue
      }
      if (normalized.endsWith(".xml")) {
        queue.push(normalized)
        continue
      }
      pageUrls.add(normalized)
    }
  }
  return Array.from(pageUrls)
}

async function safeFetch(url: string): Promise<Response | null> {
  try {
    const response = await fetch(url, { method: "GET", redirect: "follow" })
    if (!response.ok) {
      return null
    }
    return response
  } catch (error) {
    return null
  }
}

function normalizeUrl(value: string, baseUrl: URL): string | null {
  try {
    const url = new URL(value, baseUrl)
    if (url.origin !== baseUrl.origin) {
      return null
    }
    return url.toString()
  } catch (error) {
    return null
  }
}

async function warmTarget(url: string): Promise<WarmOutcome> {
  try {
    const response = await fetch(url, { method: "GET", redirect: "follow" })
    return {
      url,
      status: response.status,
      ok: response.ok,
    }
  } catch (error) {
    return {
      url,
      status: 0,
      ok: false,
      error: error instanceof Error ? error.message : "unknown error",
    }
  }
}

main().catch(error => {
  console.error(String(error))
  process.exitCode = 1
})
