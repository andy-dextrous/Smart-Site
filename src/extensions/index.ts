import type { CollectionConfig, GlobalConfig, Block, Plugin } from "payload"


const collectionsRegistry = {}


export const collections: Record<string, CollectionConfig> = collectionsRegistry

export const blocks: Record<string, Block> = {}

export const globals: Record<string, GlobalConfig> = {}

export const plugins: Record<string, Plugin> = {}
