import { getServerSideURL } from "./get-url"
import { routingEngine } from "@/admin/lib/routing"

/*************************************************************************/
/*  URL VALIDATION UTILITIES
/*************************************************************************/

/**
 * Check if a URL is external (points to a different domain than the current site)
 */
export function isExternalUrl(url: string): boolean {
  if (!url) return false

  if (url.startsWith("//")) {
    return true
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    const siteUrl = getServerSideURL()

    try {
      const siteUrlObj = new URL(siteUrl)
      const urlObj = new URL(url)

      const normalizedSitePath = routingEngine.normalizeURI(siteUrlObj.pathname)
      const normalizedUrlPath = routingEngine.normalizeURI(urlObj.pathname)

      if (siteUrlObj.host !== urlObj.host) {
        return true
      }

      return !normalizedUrlPath.startsWith(normalizedSitePath)
    } catch {
      return true
    }
  }

  return false
}
