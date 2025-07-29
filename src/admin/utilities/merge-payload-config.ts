import deepMerge from "./deep-merge"
import { resolveCollections } from "@/admin/payload/collections/registry"
import { resolveGlobals } from "@/admin/payload/globals/registry"
import { resolveBlocks } from "@/admin/payload/blocks/registry"
import { SmartSiteConfig } from "@/admin/config"

/**
 * Intelligently merges Payload configurations with SmartSite config support
 * 
 * Uses registry resolvers for collections, globals, and blocks to handle boolean overrides
 * Other properties are deep merged as before
 * 
 * @param baseConfig - The base Payload configuration  
 * @param smartSiteConfig - SmartSite configuration with separate keys
 * @returns Merged configuration
 */
export function mergePayloadConfig(baseConfig: any, smartSiteConfig: SmartSiteConfig): any {
  // Start with a deep clone of the base config
  const merged = { ...baseConfig }
  
  // Use registry resolvers for collections, globals, blocks
  if (smartSiteConfig.collections !== undefined) {
    merged.collections = resolveCollections(smartSiteConfig.collections)
  }
  
  if (smartSiteConfig.globals !== undefined) {
    merged.globals = resolveGlobals(smartSiteConfig.globals)
  }
  
  if (smartSiteConfig.blocks !== undefined) {
    merged.blocks = resolveBlocks(smartSiteConfig.blocks)
  }
  
  // Handle payload config (excluding collections, globals, blocks)
  if (smartSiteConfig.payload) {
    for (const key in smartSiteConfig.payload) {
      const baseValue = baseConfig[key]
      const clientValue = smartSiteConfig.payload[key]
      
      // Arrays like plugins are concatenated
      if (key === "plugins" && Array.isArray(baseValue) && Array.isArray(clientValue)) {
        merged[key] = [...baseValue, ...clientValue]
      } 
      // Deep merge objects
      else if (typeof baseValue === "object" && typeof clientValue === "object" && !Array.isArray(baseValue)) {
        merged[key] = deepMerge(baseValue, clientValue)
      }
      // Otherwise, client value overrides
      else {
        merged[key] = clientValue
      }
    }
  }
  
  return merged
}