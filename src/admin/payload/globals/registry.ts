import { Footer } from "./footer/config"
import { Header } from "./header/config"
import { Settings } from "./settings/index"
import { GlobalConfig } from "payload"
import { 
  DefaultGlobalKeys, 
  GlobalOverride 
} from "@/admin/config"

/*************************************************************************/
/*  DEFAULT GLOBALS REGISTRY
/*************************************************************************/

// Registry of all default globals mapped by key
export const defaultGlobals: Record<DefaultGlobalKeys, GlobalConfig> = {
  'header': Header,
  'footer': Footer,
  'settings': Settings,
}

/*************************************************************************/
/*  GLOBAL RESOLVER
/*************************************************************************/

/**
 * Resolves globals array with boolean override support
 * 
 * @param globals - Array of GlobalConfig or GlobalOverride objects
 * @returns Array of resolved GlobalConfig objects
 */
export function resolveGlobals(
  globals?: (GlobalConfig | GlobalOverride)[]
): GlobalConfig[] {
  // Start with all default globals
  const enabledDefaults = { ...defaultGlobals }
  const customGlobals: GlobalConfig[] = []
  
  // Process client configuration
  if (globals) {
    for (const item of globals) {
      // Check if it's a boolean override object
      if (isGlobalOverride(item)) {
        // Apply boolean flags to disable defaults
        for (const [key, enabled] of Object.entries(item)) {
          if (enabled === false && key in enabledDefaults) {
            delete enabledDefaults[key as DefaultGlobalKeys]
          }
        }
      } else {
        // It's a custom global config
        customGlobals.push(item)
      }
    }
  }
  
  // Return enabled defaults + custom globals
  return [
    ...Object.values(enabledDefaults),
    ...customGlobals
  ]
}

/*************************************************************************/
/*  TYPE GUARDS
/*************************************************************************/

function isGlobalOverride(
  item: GlobalConfig | GlobalOverride
): item is GlobalOverride {
  // Check if object has any default global keys with boolean values
  const keys = Object.keys(item)
  return keys.some(key => 
    key in defaultGlobals && 
    typeof (item as any)[key] === 'boolean'
  )
}