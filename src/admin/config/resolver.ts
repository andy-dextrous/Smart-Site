// server-only - removed for type generation compatibility
import type { SmartSiteConfig } from "./defaults"
import type { CollectionConfig, GlobalConfig, Block, Plugin, CollectionSlug } from "payload"
import { applyFrontendWrapper } from "./frontend"

import { Users } from "@/admin/payload/collections/users"
import { Media } from "@/admin/payload/collections/media"
import { Pages } from "@/admin/payload/collections/pages"
import { Posts } from "@/admin/payload/collections/posts"
import { Categories } from "@/admin/payload/collections/categories"
import { Team } from "@/admin/payload/collections/team"
import { Services } from "@/admin/payload/collections/services"
import { Testimonials } from "@/admin/payload/collections/testimonials"
import { Templates } from "@/admin/payload/collections/templates"
import { getURIIndexCollection } from "@/admin/payload/collections/uri-index"

import { Header } from "@/admin/payload/globals/header/config"
import { Footer } from "@/admin/payload/globals/footer/config"
import { Settings } from "@/admin/payload/globals/settings"
import { AISettings } from "@/admin/payload/globals/ai-settings"

import { Code } from "@/admin/payload/blocks/code/config"
import { FormBlock } from "@/admin/payload/blocks/form/config"
import { MediaBlock } from "@/admin/payload/blocks/media/config"

import { getPlugins } from "@/admin/payload/plugins"
import * as extensions from "@/extensions"

/*************************************************************************/
/*  DEFAULT MAPPINGS
/*************************************************************************/

const defaultCollectionMap: Record<string, CollectionConfig> = {
  pages: Pages,
  posts: Posts,
  media: Media,
  users: Users,
  categories: Categories,
  team: Team,
  services: Services,
  testimonials: Testimonials,
  templates: Templates
}

const defaultGlobalMap: Record<string, GlobalConfig> = {
  header: Header,
  footer: Footer,
  settings: Settings,
  "ai-settings": AISettings
}

const defaultBlockMap: Record<string, Block> = {
  code: Code,
  form: FormBlock,
  media: MediaBlock
}

/*************************************************************************/
/*  CONFIGURATION RESOLVER
/*************************************************************************/

export function resolveConfiguration(config: SmartSiteConfig) {
  const validConfig = config
  
  const collections = resolveCollections(validConfig)
  const blocks = resolveBlocks(validConfig)
  const globals = resolveGlobals(validConfig)
  const plugins = resolvePlugins(validConfig)
  
  return {
    collections,
    blocks,
    globals,
    plugins,
    config: validConfig
  }
}

/*************************************************************************/
/*  COLLECTION RESOLVER
/*************************************************************************/

// System collections that must always be included for the app to function
const SYSTEM_COLLECTIONS = ["users", "templates"]

const COLLECTION_DEPENDENCY_WARNINGS: Record<string, string> = {
  categories:
    "Collection 'categories' is referenced by core relationships (pages.categories, posts.categories). Disable only if those fields are removed or reconfigured.",
  media:
    "Collection 'media' powers upload fields across the app. Disabling it will break media relationships unless every upload field is overridden.",
}

function resolveCollections(
  config: SmartSiteConfig
): CollectionConfig[] {
  const slugs = new Set<string>()
  const resolved: CollectionConfig[] = []
  
  for (const slug of Object.keys(defaultCollectionMap)) {
    // System collections are always included
    if (SYSTEM_COLLECTIONS.includes(slug)) {
      slugs.add(slug)
      
      // Check if there's an override in the registry
      const extensionOverride = extensions.collections[slug]
      if (extensionOverride) {
        resolved.push(extensionOverride)
      } else {
        resolved.push(defaultCollectionMap[slug])
      }
      continue
    }
    
    // Check if collection is enabled in config
    const collectionConfig = config.collections[slug]
    if (!collectionConfig || !collectionConfig.enabled) {
      const warning = COLLECTION_DEPENDENCY_WARNINGS[slug]
      if (warning) {
        console.warn(`⚠️  smartsite.config.ts: ${warning}`)
      }
      continue
    }
    slugs.add(slug)
    
    // Check if there's an override in the registry
    const extensionOverride = extensions.collections[slug]
    const baseCollection = extensionOverride || defaultCollectionMap[slug]
    
    const finalCollection = applyFrontendWrapper(baseCollection, slug, config)
    resolved.push(finalCollection)
  }
  
  for (const slug of config.extensions?.collections || []) {
    if (Object.keys(defaultCollectionMap).includes(slug) || slug === "uri-index") {
      continue
    }
    
    // Check if extension exists in registry
    const extension = extensions.collections[slug]
    if (!extension) {
      throw new Error(`Extension collection '${slug}' declared but not found in src/extensions/index.ts registry`)
    }
    
    if (slugs.has(slug)) {
      throw new Error(`Duplicate collection slug: ${slug}`)
    }
    
    slugs.add(slug)
    
    const finalCollection = applyFrontendWrapper(extension, slug, config)
    resolved.push(finalCollection)
  }
  
  const frontendRelationSlugs = resolved
    .filter(collection => {
      const collectionConfig = config.collections[collection.slug]
      return collectionConfig?.frontend && collectionConfig?.enabled
    })
    .map(collection => collection.slug as CollectionSlug)

  const uriIndexOverride = extensions.collections["uri-index"]
  const uriIndexCollection = uriIndexOverride || getURIIndexCollection(frontendRelationSlugs)

  if (!slugs.has("uri-index")) {
    resolved.push(uriIndexCollection)
    slugs.add("uri-index")
  }

  return resolved
}

/*************************************************************************/
/*  BLOCK RESOLVER
/*************************************************************************/

function resolveBlocks(
  config: SmartSiteConfig
): Block[] {
  const slugs = new Set<string>()
  const resolved: Block[] = []
  
  for (const slug of Object.keys(defaultBlockMap)) {
    slugs.add(slug)
    
    // Check if there's an override in the registry
    const extensionOverride = extensions.blocks[slug]
    if (extensionOverride) {
      resolved.push(extensionOverride)
    } else {
      resolved.push(defaultBlockMap[slug])
    }
  }
  
  for (const slug of config.extensions?.blocks || []) {
    if (Object.keys(defaultBlockMap).includes(slug)) {
      continue
    }
    
    // Check if extension exists in registry
    const extension = extensions.blocks[slug]
    if (!extension) {
      throw new Error(`Extension block '${slug}' declared but not found in src/extensions/index.ts registry`)
    }
    
    if (slugs.has(slug)) {
      throw new Error(`Duplicate block slug: ${slug}`)
    }
    
    slugs.add(slug)
    resolved.push(extension)
  }
  
  return resolved
}

/*************************************************************************/
/*  GLOBAL RESOLVER
/*************************************************************************/

function resolveGlobals(
  config: SmartSiteConfig
): GlobalConfig[] {
  const slugs = new Set<string>()
  const resolved: GlobalConfig[] = []
  
  for (const slug of Object.keys(defaultGlobalMap)) {
    slugs.add(slug)
    
    // Check if there's an override in the registry
    const extensionOverride = extensions.globals[slug]
    if (extensionOverride) {
      resolved.push(extensionOverride)
    } else {
      resolved.push(defaultGlobalMap[slug])
    }
  }
  
  for (const slug of config.extensions?.globals || []) {
    if (Object.keys(defaultGlobalMap).includes(slug)) {
      continue
    }
    
    // Check if extension exists in registry
    const extension = extensions.globals[slug]
    if (!extension) {
      throw new Error(`Extension global '${slug}' declared but not found in src/extensions/index.ts registry`)
    }
    
    if (slugs.has(slug)) {
      throw new Error(`Duplicate global slug: ${slug}`)
    }
    
    slugs.add(slug)
    resolved.push(extension)
  }
  
  return resolved
}

/*************************************************************************/
/*  PLUGIN RESOLVER
/*************************************************************************/

function resolvePlugins(
  config: SmartSiteConfig
): Plugin[] {
  const resolved: Plugin[] = []
  const seen = new Set<string>()
  
  // Get default plugins (includes storage plugins based on config)
  const defaultPlugins = getPlugins()
  resolved.push(...defaultPlugins)
  defaultPlugins.forEach(() => seen.add("default"))
  
  // Add extension plugins
  for (const slug of config.extensions?.plugins || []) {
    // Check if extension exists in registry
    const extension = extensions.plugins[slug]
    if (!extension) {
      throw new Error(`Extension plugin '${slug}' declared but not found in src/extensions/index.ts registry`)
    }
    
    if (seen.has(slug)) {
      throw new Error(`Duplicate plugin: ${slug}`)
    }
    
    seen.add(slug)
    resolved.push(extension)
  }
  
  return resolved
}
