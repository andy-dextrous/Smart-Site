import type { CollectionBeforeChangeHook } from "payload"

/*************************************************************************/
/*  EXTRACT IDS FROM POPULATED RELATIONSHIPS
/*************************************************************************/

function extractIds(data: any): any {
  if (!data) return data

  if (Array.isArray(data)) {
    return data.map(item => extractIds(item))
  }

  if (typeof data === "object" && data !== null) {
    // If it's a populated relationship (has id AND other media/relationship properties), return just the id
    if (
      data.id &&
      typeof data.id === "string" &&
      (data.filename || data.url || data.alt || data.mimeType)
    ) {
      return data.id
    }

    // Otherwise, recursively process the object's properties
    const result: any = {}
    for (const [key, value] of Object.entries(data)) {
      result[key] = extractIds(value)
    }
    return result
  }

  // Return primitives as-is
  return data
}

/*************************************************************************/
/*  APPLY DEFAULT TEMPLATE HOOK FACTORY
/*************************************************************************/

export function createApplyDefaultTemplateHook(
  collectionName: string
): CollectionBeforeChangeHook {
  return async ({ data, req, operation }) => {
    // Only apply on create operations when no sections exist
    if (operation === "create" && (!data.sections || data.sections.length === 0)) {
      try {
        // Get template directly from routing settings to avoid circular dependency
        const settings = await req.payload.findGlobal({
          slug: "settings",
          depth: 1,
        })

        const templateField =
          collectionName === "pages"
            ? "pagesDefaultTemplate"
            : `${collectionName}SingleTemplate`
        const templateId = (settings?.routing as any)?.[templateField]

        let defaultTemplate = null
        if (templateId) {
          try {
            defaultTemplate = await req.payload.findByID({
              collection: "templates",
              id: typeof templateId === "object" ? templateId.id : templateId,
              depth: 2,
            })
          } catch (error) {
            console.warn(`Failed to fetch template ${templateId}:`, error)
          }
        }

        if (defaultTemplate?.sections) {
          // Extract IDs from populated relationships for server-side operation
          const sectionsWithIds = extractIds(defaultTemplate.sections)
          data.sections = sectionsWithIds
          req.payload.logger.info(
            `Applied template: ${defaultTemplate.sections.length} sections to ${collectionName}`
          )
        }
      } catch (error) {
        req.payload.logger.error(
          `Error applying default template for ${collectionName}:`,
          error
        )
        // Continue without template - don't block content creation
      }
    }

    return data
  }
}

/*************************************************************************/
/*  PAGES COLLECTION HOOK
/*************************************************************************/

export const applyDefaultTemplate = createApplyDefaultTemplateHook("pages")
