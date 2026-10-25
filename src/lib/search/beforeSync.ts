import { buildSearchText } from "./search-text"
import { BeforeSync, DocToSync } from "@payloadcms/plugin-search/types"
import { shouldPreventHooks } from "@/lib/prevent-hooks"

export const beforeSyncWithSearch: BeforeSync = async ({
  originalDoc,
  searchDoc,
  req,
}) => {
  const {
    doc: { relationTo: collection },
  } = searchDoc

  const { slug, id, categories, title, meta, uri } = originalDoc

  const hooksDisabled = shouldPreventHooks(req.payload, req.context)
  const payloadInstance = req.payload

  const modifiedDoc: DocToSync = {
    ...searchDoc,
    slug: slug ?? null,
    meta: {
      ...(meta || {}),
      title: meta?.title || title || searchDoc.meta?.title || null,
      image: meta?.image?.id || meta?.image,
      description: meta?.description || searchDoc.meta?.description || null,
    },
    uri: uri || searchDoc.uri || null,
    categories: Array.isArray(searchDoc.categories) ? searchDoc.categories : [],
  }

  type NormalizedCategory = {
    relationTo: "categories"
    id: string
    title: string | null
  }

  async function resolveCategoryEntry(entry: any): Promise<NormalizedCategory | null> {
    if (!entry) {
      return null
    }

    const extractId = (value: any): string | null => {
      if (typeof value === "string" || typeof value === "number") {
        return String(value)
      }
      if (value && typeof value === "object") {
        if (typeof value.id === "string" || typeof value.id === "number") {
          return String(value.id)
        }
        if (typeof value.value === "string" || typeof value.value === "number") {
          return String(value.value)
        }
        if (value.value && typeof value.value === "object" && value.value.id) {
          return String(value.value.id)
        }
      }
      return null
    }

    const extractTitle = (value: any): string | null => {
      if (!value || typeof value !== "object") {
        return null
      }
      if (typeof value.title === "string") {
        return value.title
      }
      if (
        value.value &&
        typeof value.value === "object" &&
        typeof value.value.title === "string"
      ) {
        return value.value.title
      }
      return null
    }

    const resolvedId = extractId(entry)
    if (!resolvedId) {
      return null
    }

    let resolvedTitle = extractTitle(entry)

    if (
      !resolvedTitle &&
      !hooksDisabled &&
      typeof payloadInstance?.findByID === "function"
    ) {
      try {
        const categoryDoc = await payloadInstance.findByID({
          collection: "categories",
          id: resolvedId,
          depth: 0,
          overrideAccess: false,
        })
        if (categoryDoc && typeof categoryDoc.title === "string") {
          resolvedTitle = categoryDoc.title
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error"
        if (payloadInstance?.logger?.warn) {
          payloadInstance.logger.warn(
            `Failed to load category '${resolvedId}' while syncing search index (${collection}/${id}): ${message}`
          )
        } else {
          console.warn(
            `Failed to load category '${resolvedId}' while syncing search index (${collection}/${id}): ${message}`
          )
        }
      }
    }

    return {
      relationTo: "categories",
      id: resolvedId,
      title: resolvedTitle ?? null,
    }
  }

  if (Array.isArray(categories) && categories.length > 0) {
    const unique = new Set<string>()
    const normalized: NormalizedCategory[] = []

    for (const entry of categories) {
      const resolved = await resolveCategoryEntry(entry)
      if (!resolved || unique.has(resolved.id)) {
        continue
      }
      unique.add(resolved.id)
      normalized.push(resolved)
    }

    if (normalized.length > 0) {
      modifiedDoc.categories = normalized
    }
  }

  modifiedDoc.searchText = buildSearchText(modifiedDoc)

  if (hooksDisabled) {
    const { id: _omit, ...rest } = modifiedDoc
    return rest as DocToSync
  }

  return modifiedDoc
}
