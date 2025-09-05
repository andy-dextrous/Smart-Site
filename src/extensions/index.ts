import type { CollectionConfig, GlobalConfig, Block, Plugin } from "payload"

/*************************************************************************/
/*  EXTENSION REGISTRY
/*************************************************************************/

// Import your extensions here and add them to the appropriate exports
// This avoids dynamic imports and gives webpack explicit paths

// Collections
import FAQ from "./collections/faq"

// Blocks (add imports as needed)
// import CustomBlock from "./blocks/custom-block"

// Globals (add imports as needed)
// import CustomGlobal from "./globals/custom-global"

// Plugins (add imports as needed)
// import CustomPlugin from "./plugins/custom-plugin"

/*************************************************************************/
/*  EXPORTS
/*************************************************************************/

export const collections: Record<string, CollectionConfig> = {
  faq: FAQ,
  // Add more collections here
}

export const blocks: Record<string, Block> = {
  // Add blocks here
}

export const globals: Record<string, GlobalConfig> = {
  // Add globals here
}

export const plugins: Record<string, Plugin> = {
  // Add plugins here
}