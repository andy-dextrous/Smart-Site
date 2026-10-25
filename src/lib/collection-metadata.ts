import type { CollectionConfig, Config, GlobalConfig, Plugin } from "payload"

export interface WebsiteCollectionMetadata {
  route?: boolean
  label?: string
  seo?: boolean
  search?: boolean
  mcp?: boolean
  sitemap?: {
    enabled: boolean
    priority: number
    changefreq: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never"
    respectNoIndex: boolean
  }
}
export type WebsiteCollection = {
  slug: string
  label: string
  hasSEO: boolean
  searchEnabled: boolean
  sitemap?: WebsiteCollectionMetadata["sitemap"]
}
export function websiteMetadata(
  config: Pick<CollectionConfig | GlobalConfig, "custom">
): WebsiteCollectionMetadata {
  return (config.custom?.smartsite || {}) as WebsiteCollectionMetadata
}
export function websiteCollections(
  config: Pick<Config, "collections">
): WebsiteCollection[] {
  return (config.collections || [])
    .filter(item => websiteMetadata(item).route)
    .map(item => {
      const meta = websiteMetadata(item)
      return {
        slug: item.slug,
        label: meta.label || String(item.labels?.plural || item.slug),
        hasSEO: meta.seo !== false,
        searchEnabled: meta.search !== false,
        sitemap: meta.sitemap,
      }
    })
}
export function isWebsiteCollection(config: Pick<CollectionConfig, "custom">) {
  return websiteMetadata(config).route === true
}

/** Schema-time consumers and runtime routing must describe the same website. */
export function assertWebsiteInventory(expected: WebsiteCollection[]): Plugin {
  return config => {
    if (JSON.stringify(websiteCollections(config)) !== JSON.stringify(expected)) {
      throw new Error(
        "Register website collections in payload.config.ts before building the inventory. A later plugin changed website routing metadata; move that collection/metadata into the explicit registration list."
      )
    }
    return config
  }
}
