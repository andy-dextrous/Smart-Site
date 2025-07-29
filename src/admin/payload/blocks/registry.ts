import { MediaBlock } from "./media/config"
import { Code } from "./code/config"
import { FormBlock } from "./form/config"
import { Block } from "payload"
import { 
  DefaultBlockKeys, 
  BlockOverride 
} from "@/admin/config"

/*************************************************************************/
/*  DEFAULT BLOCKS REGISTRY
/*************************************************************************/

// Registry of all default blocks mapped by key
export const defaultBlocks: Record<DefaultBlockKeys, Block> = {
  'code': Code,
  'form': FormBlock,
  'media-block': MediaBlock,
}

/*************************************************************************/
/*  BLOCK RESOLVER
/*************************************************************************/

/**
 * Resolves blocks array with boolean override support
 * 
 * @param blocks - Array of Block or BlockOverride objects
 * @returns Array of resolved Block objects
 */
export function resolveBlocks(
  blocks?: (Block | BlockOverride)[]
): Block[] {
  // Start with all default blocks
  const enabledDefaults = { ...defaultBlocks }
  const customBlocks: Block[] = []
  
  // Process client configuration
  if (blocks) {
    for (const item of blocks) {
      // Check if it's a boolean override object
      if (isBlockOverride(item)) {
        // Apply boolean flags to disable defaults
        for (const [key, enabled] of Object.entries(item)) {
          if (enabled === false && key in enabledDefaults) {
            delete enabledDefaults[key as DefaultBlockKeys]
          }
        }
      } else {
        // It's a custom block config
        customBlocks.push(item)
      }
    }
  }
  
  // Return enabled defaults + custom blocks
  return [
    ...Object.values(enabledDefaults),
    ...customBlocks
  ]
}

/*************************************************************************/
/*  TYPE GUARDS
/*************************************************************************/

function isBlockOverride(
  item: Block | BlockOverride
): item is BlockOverride {
  // Check if object has any default block keys with boolean values
  const keys = Object.keys(item)
  return keys.some(key => 
    key in defaultBlocks && 
    typeof (item as any)[key] === 'boolean'
  )
}