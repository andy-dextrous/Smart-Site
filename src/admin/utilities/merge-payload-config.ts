import deepMerge from "./deep-merge"

/**
 * Intelligently merges Payload configurations with special handling for arrays
 * 
 * Arrays like collections, globals, and plugins are concatenated rather than replaced
 * Other properties are deep merged
 * 
 * @param baseConfig - The base Payload configuration
 * @param clientConfig - Client overrides/extensions
 * @returns Merged configuration
 */
export function mergePayloadConfig(baseConfig: any, clientConfig: any = {}): any {
  // Arrays that should be concatenated, not replaced
  const concatenateArrays = ["collections", "globals", "plugins", "blocks"]
  
  // Start with a deep clone of the base config
  const merged = { ...baseConfig }
  
  // Handle each property in the client config
  for (const key in clientConfig) {
    const baseValue = baseConfig[key]
    const clientValue = clientConfig[key]
    
    // Special handling for arrays that should be concatenated
    if (concatenateArrays.includes(key) && Array.isArray(baseValue) && Array.isArray(clientValue)) {
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
  
  return merged
}