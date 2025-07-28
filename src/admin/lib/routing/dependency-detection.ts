import {
  getArchiveSettings,
  getAllArchivePageFieldNames,
  getAllTemplateFieldNames,
  getSettingsFieldValue,
  getFrontendCollections,
} from "@/admin/payload/collections/frontend"

export interface ArchiveDependency {
  collection: string
  archivePageId: string
  archivePageSlug: string
  itemCount: number
}

/*************************************************************************/
/*  ARCHIVE PAGE DEPENDENCY ANALYSIS
/*************************************************************************/

export async function getArchiveChildCollections(
  pageId: string,
  payload?: any
): Promise<ArchiveDependency[]> {
  let payloadInstance = payload
  if (!payloadInstance) {
    const configPromise = await import("@payload-config")
    const { getPayload } = await import("payload")
    payloadInstance = await getPayload({ config: configPromise.default })
  }

  const settings = await payloadInstance.findGlobal({
    slug: "settings",
    depth: 0,
    overrideAccess: true,
  })

  const routing = settings?.routing

  if (!routing) return []

  const dependencies: ArchiveDependency[] = []

  const archiveSettings = getArchiveSettings()

  for (const setting of archiveSettings) {
    const archivePage = routing[setting.field]
    if (archivePage?.id === pageId) {
      let pageSlug = setting.collection
      try {
        const fullPage = await payloadInstance.findByID({
          collection: "pages",
          id: pageId,
          depth: 0,
          overrideAccess: true,
        })
        if (fullPage?.slug) {
          pageSlug = fullPage.slug
        }
      } catch (error) {
        pageSlug = setting.collection
      }

      dependencies.push({
        collection: setting.collection,
        archivePageId: pageId,
        archivePageSlug: pageSlug,
        itemCount: 0,
      })
    }
  }

  return dependencies
}

export function detectArchiveChanges(
  oldSettings: any,
  newSettings: any
): Array<{ collection: string; oldArchive?: string; newArchive?: string }> {
  const changes = []

  const archiveFields = getAllArchivePageFieldNames()

  for (const field of archiveFields) {
    const oldValue = getSettingsFieldValue(oldSettings, field)
    const newValue = getSettingsFieldValue(newSettings, field)

    if (oldValue !== newValue) {
      const collection = field.replace("ArchivePage", "")
      changes.push({
        collection,
        oldArchive: oldValue,
        newArchive: newValue,
      })
    }
  }

  return changes
}

export function detectTemplateChanges(
  oldSettings: any,
  newSettings: any
): Array<{ collection: string; oldTemplate?: string; newTemplate?: string }> {
  const changes = []

  const templateFields = getAllTemplateFieldNames()

  for (const field of templateFields) {
    const oldValue = getSettingsFieldValue(oldSettings, field)
    const newValue = getSettingsFieldValue(newSettings, field)

    if (oldValue !== newValue) {
      // Handle both "pagesDefaultTemplate" and "{collection}SingleTemplate" patterns
      let collection: string
      if (field === "pagesDefaultTemplate") {
        collection = "pages"
      } else if (field.endsWith("SingleTemplate")) {
        collection = field.replace("SingleTemplate", "")
      } else {
        // Skip unknown field patterns silently
        continue
      }

      changes.push({
        collection,
        oldTemplate: oldValue,
        newTemplate: newValue,
      })
    }
  }

  return changes
}

/*************************************************************************/
/*  INTEGRATION CHANGES
/*************************************************************************/

export function detectIntegrationChanges(oldSettings: any, newSettings: any): boolean {
  const oldIntegrations = oldSettings?.integrations
  const newIntegrations = newSettings?.integrations

  return (
    oldIntegrations?.googleAnalytics !== newIntegrations?.googleAnalytics ||
    oldIntegrations?.googleTagManager !== newIntegrations?.googleTagManager ||
    oldIntegrations?.head !== newIntegrations?.head ||
    oldIntegrations?.bodyEnd !== newIntegrations?.bodyEnd
  )
}

export function detectGeneralChanges(oldSettings: any, newSettings: any): boolean {
  const oldGeneral = oldSettings?.general
  const newGeneral = newSettings?.general

  return (
    oldGeneral?.siteName !== newGeneral?.siteName ||
    oldGeneral?.siteDescription !== newGeneral?.siteDescription
  )
}

export function detectSocialChanges(oldSettings: any, newSettings: any): boolean {
  const oldSocial = oldSettings?.social?.socialLinks || []
  const newSocial = newSettings?.social?.socialLinks || []

  return JSON.stringify(oldSocial) !== JSON.stringify(newSocial)
}

export function detectLocationChanges(oldSettings: any, newSettings: any): boolean {
  const oldLocations = oldSettings?.general?.locations || []
  const newLocations = newSettings?.general?.locations || []

  return JSON.stringify(oldLocations) !== JSON.stringify(newLocations)
}

/*************************************************************************/
/*  PAGE HIERARCHY ANALYSIS
/*************************************************************************/

export async function findDescendantPages(
  parentId: string,
  payload?: any
): Promise<any[]> {
  let payloadInstance = payload
  if (!payloadInstance) {
    const configPromise = await import("@payload-config")
    const { getPayload } = await import("payload")
    payloadInstance = await getPayload({ config: configPromise.default })
  }

  const descendants = await payloadInstance.find({
    collection: "pages",
    where: {
      parent: { equals: parentId },
    },
    limit: 1000,
    depth: 2,
    overrideAccess: true,
  })

  const allDescendants = [...descendants.docs]
  for (const child of descendants.docs) {
    const childDescendants = await findDescendantPages(child.id, payloadInstance)
    allDescendants.push(...childDescendants)
  }

  return allDescendants
}

export function detectHierarchyChanges(
  doc: any,
  previousDoc: any
): { parentChanged: boolean; oldParent?: string; newParent?: string } {
  const oldParent = previousDoc?.parent?.id || previousDoc?.parent
  const newParent = doc?.parent?.id || doc?.parent

  return {
    parentChanged: oldParent !== newParent,
    oldParent,
    newParent,
  }
}

/*************************************************************************/
/*  GLOBAL SETTINGS ANALYSIS
/*************************************************************************/

export function detectHomepageChange(
  oldSettings: any,
  newSettings: any
): { changed: boolean; oldHomepage?: string; newHomepage?: string } {
  const oldHomepage = oldSettings?.routing?.homepage?.id
  const newHomepage = newSettings?.routing?.homepage?.id

  return {
    changed: oldHomepage !== newHomepage,
    oldHomepage,
    newHomepage,
  }
}

export function detectAllSettingsChanges(oldSettings: any, newSettings: any) {
  return {
    archiveChanges: detectArchiveChanges(oldSettings, newSettings),
    homepageChange: detectHomepageChange(oldSettings, newSettings),
    templateChanges: detectTemplateChanges(oldSettings, newSettings),
    integrationChanges: detectIntegrationChanges(oldSettings, newSettings),
    generalChanges: detectGeneralChanges(oldSettings, newSettings),
    socialChanges: detectSocialChanges(oldSettings, newSettings),
    locationChanges: detectLocationChanges(oldSettings, newSettings),
  }
}

/*************************************************************************/
/*  COLLECTION ITEMS USING ARCHIVE
/*************************************************************************/

export async function getCollectionItemsForArchive(
  collection: string,
  limit = 1000,
  payload?: any
): Promise<any[]> {
  let payloadInstance = payload
  if (!payloadInstance) {
    const configPromise = await import("@payload-config")
    const { getPayload } = await import("payload")
    payloadInstance = await getPayload({ config: configPromise.default })
  }

  // Try to query with _status first (for collections with drafts enabled)
  // If that fails, fall back to querying without _status filter
  try {
    const items = await payloadInstance.find({
      collection: collection as any,
      where: {
        _status: { equals: "published" },
      },
      limit,
      depth: 1,
      overrideAccess: true,
    })

    return items.docs
  } catch (error) {
    // If _status query fails, the collection likely doesn't have drafts enabled
    const items = await payloadInstance.find({
      collection: collection as any,
      limit,
      depth: 1,
      overrideAccess: true,
    })

    return items.docs
  }
}

/*************************************************************************/
/*  DEPENDENCY DETECTION UTILITIES
/*************************************************************************/

export async function shouldTriggerArchiveDependentUpdates(
  collection: string,
  doc: any,
  previousDoc: any
): Promise<boolean> {
  // Only pages can trigger archive dependent updates
  if (collection !== "pages") return false

  // Only trigger dependent updates for published content
  if (doc._status !== "published") return false

  // Check if this page is used as an archive page
  const collections = await getArchiveChildCollections(doc.id)
  if (collections.length === 0) return false

  // Check for slug changes
  const oldSlug = previousDoc?.slug
  const newSlug = doc?.slug

  return oldSlug !== newSlug
}

export async function shouldTriggerHierarchyDependentUpdates(
  collection: string,
  doc: any,
  previousDoc: any
): Promise<boolean> {
  // Only pages have hierarchy
  if (collection !== "pages") return false

  // Only trigger dependent updates for published content
  if (doc._status !== "published") return false

  const hierarchyChanges = detectHierarchyChanges(doc, previousDoc)
  return hierarchyChanges.parentChanged
}

/*************************************************************************/
/*  DEPENDENT UPDATES OPERATION UTILITIES
/*************************************************************************/

export async function getDependentUpdatesImpactSize(
  operation: string,
  entityId: string,
  payload?: any
): Promise<number> {
  let impactSize = 0

  switch (operation) {
    case "archive-page-update":
      const archiveDependencies = await getArchiveChildCollections(entityId, payload)
      for (const dep of archiveDependencies) {
        const items = await getCollectionItemsForArchive(dep.collection, 1000, payload)
        impactSize += items.length
      }
      break

    case "page-hierarchy-update":
      const descendants = await findDescendantPages(entityId, payload)
      impactSize = descendants.length
      break

    case "homepage-change":
      impactSize = 1 // Just the homepage itself
      break

    case "template-change":
    case "settings-change":
      // For template and settings changes, we estimate based on all collections
      // This is an approximation since we don't have the specific collections affected here
      const frontendCollections = getFrontendCollections()

      for (const collection of frontendCollections) {
        if (collection.slug !== "pages") {
          const items = await getCollectionItemsForArchive(collection.slug, 1000, payload)
          impactSize += items.length
        }
      }

      // Use payload instance for pages query
      let payloadInstance = payload
      if (!payloadInstance) {
        try {
          const configPromise = await import("@payload-config")
          const { getPayload } = await import("payload")
          payloadInstance = await getPayload({ config: configPromise.default })
        } catch (error) {
          return 0
        }
      }

      const pages = await payloadInstance.find({
        collection: "pages",
        where: { _status: { equals: "published" } },
        limit: 1000,
        depth: 1,
        overrideAccess: true,
      })
      impactSize += pages.docs.length
      break

    default:
      impactSize = 0
  }

  return impactSize
}
