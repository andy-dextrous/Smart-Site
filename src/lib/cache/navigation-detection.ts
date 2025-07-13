import { getSettings, getHomepage } from "@/lib/data/globals"
import { isFrontendCollection, frontendCollections } from "@/payload/collections/frontend"
import type { ChangeDetection } from "./change-detection"

export interface NavigationImpact {
  affectsHeader: boolean
  affectsFooter: boolean
  affectsMenus: boolean
  reason: string[]
}

/*************************************************************************/
/*  NAVIGATION IMPACT ANALYSIS
/*************************************************************************/

export async function getNavigationImpact(
  collection: string,
  doc: any,
  changes: ChangeDetection
): Promise<NavigationImpact> {
  const impact: NavigationImpact = {
    affectsHeader: false,
    affectsFooter: false,
    affectsMenus: false,
    reason: [],
  }

  // Publication status changes always affect navigation (visibility)
  if (changes.statusChanged) {
    impact.affectsHeader = impact.affectsFooter = impact.affectsMenus = true
    impact.reason.push("Publication status changed")
    return impact
  }

  // Pages with navigation settings
  if (collection === "pages") {
    if (doc.includeInNav && (changes.uriChanged || changes.contentChanged)) {
      impact.affectsHeader = impact.affectsFooter = true
      impact.reason.push("Page appears in navigation menus")
    }
  }

  // Archive pages often appear in navigation
  if (await isArchivePage(doc.id)) {
    impact.affectsHeader = impact.affectsFooter = true
    impact.reason.push("Page is used as archive (likely in navigation)")
  }

  // Homepage changes always affect navigation
  const homepage = await getHomepage()
  if (homepage?.id === doc.id) {
    impact.affectsHeader = impact.affectsFooter = impact.affectsMenus = true
    impact.reason.push("Homepage changes affect site navigation")
  }

  // Frontend collection items that might appear in "latest content" widgets
  if (
    isFrontendCollection(collection) &&
    collection !== "pages" &&
    changes.statusChanged
  ) {
    impact.affectsHeader = impact.affectsFooter = true
    impact.reason.push(`${collection} status change may affect latest content widgets`)
  }

  // Content-only changes (no URI, no status change) typically don't affect navigation
  if (changes.contentChanged && !changes.uriChanged && !changes.statusChanged) {
    impact.reason.push("Content-only change - navigation unaffected")
  }

  return impact
}

/*************************************************************************/
/*  ARCHIVE PAGE DETECTION
/*************************************************************************/

async function isArchivePage(pageId: string): Promise<boolean> {
  try {
    const settings = await getSettings()

    // Check if this page is used as an archive in routing settings
    const routing = settings.routing
    if (!routing) return false

    // Dynamically check all frontend collections for archive page assignments
    const archivePages = frontendCollections
      .map(collection => {
        const archivePropertyName = `${collection.slug}ArchivePage`
        return routing[archivePropertyName]?.id
      })
      .filter(Boolean)

    return archivePages.includes(pageId)
  } catch (error) {
    console.error("Error checking archive page status:", error)
    return false
  }
}

/*************************************************************************/
/*  COLLECTIONS USING ARCHIVE DETECTION
/*************************************************************************/

export async function getCollectionsUsingArchive(
  archivePageId: string
): Promise<Array<{ collection: string; archiveType: string }>> {
  try {
    const settings = await getSettings()
    const routing = settings.routing
    if (!routing) return []

    // Dynamically check all frontend collections for matching archive pages
    const collections = frontendCollections
      .map(collection => {
        const archivePropertyName = `${collection.slug}ArchivePage`
        if (routing[archivePropertyName]?.id === archivePageId) {
          return {
            collection: collection.slug,
            archiveType: collection.slug,
          }
        }
        return null
      })
      .filter(Boolean) as Array<{ collection: string; archiveType: string }>

    return collections
  } catch (error) {
    console.error("Error getting collections using archive:", error)
    return []
  }
}

/*************************************************************************/
/*  UTILITY FUNCTIONS
/*************************************************************************/

export function shouldTriggerNavigationRevalidation(impact: NavigationImpact): boolean {
  return impact.affectsHeader || impact.affectsFooter || impact.affectsMenus
}

export function getNavigationInvalidationTags(impact: NavigationImpact): string[] {
  const tags: string[] = []

  if (impact.affectsHeader) {
    tags.push("global:header")
  }

  if (impact.affectsFooter) {
    tags.push("global:footer")
  }

  return tags
}
