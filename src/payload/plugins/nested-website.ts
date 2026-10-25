import { nestedDocsPlugin } from "@payloadcms/plugin-nested-docs"
import type { Plugin } from "payload"

/** Retain native parent/breadcrumb fields and beforeChange calculation.
 * Cascades belong to the durable publication runner: native recursive resaves
 * are unbounded and create content versions merely to update derived URLs.
 */
export function nestedWebsite(
  options: Parameters<typeof nestedDocsPlugin>[0],
  durableCollections: string[] = ["pages"]
): Plugin {
  const native = nestedDocsPlugin(options)
  return async config => {
    const result = await native(config)
    return {
      ...result,
      collections: result.collections?.map(collection => {
        if (!durableCollections.includes(collection.slug)) return collection
        const original = config.collections?.find(item => item.slug === collection.slug)
        return {
          ...collection,
          hooks: { ...collection.hooks, afterChange: original?.hooks?.afterChange || [] },
        }
      }),
    }
  }
}
