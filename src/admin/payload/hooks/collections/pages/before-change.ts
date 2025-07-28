import {
  shouldTriggerArchiveDependentUpdates,
  shouldTriggerHierarchyDependentUpdates,
  getArchiveChildCollections,
  detectHierarchyChanges,
} from "@/admin/lib/routing/dependency-detection"
import { getDependentUpdatesContext } from "@/admin/payload/hooks/utilities/context-management"
import { shouldPreventHooks } from "@/admin/utilities/prevent-hooks"
import type { CollectionBeforeChangeHook } from "payload"

/*************************************************************************/
/*  PAGES-SPECIFIC BEFORE CHANGE HOOK
/*
/*  Handles dependency detection for archive and hierarchy changes
/*
/*  This hook:
/*  - Detects when archive pages change (affects all collection items)
/*  - Detects when parent pages move (affects all child pages)
/*  - Queues dependent updates for background processing
/*  - Only runs for pages collection
/*  - Uses direct database access (no caching) for data consistency
/*  - Stores fresh page data in context for job processing
/*************************************************************************/

export const beforePageChange: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req: { payload, context },
  collection,
}) => {
  if (collection.slug !== "pages") return data

  if (shouldPreventHooks(payload, context)) {
    return data
  }

  // Store fresh page data in context for job processing
  if (!context.freshData) {
    ;(context as any).freshData = {}
  }
  ;(context as any).freshData.pages = (context as any).freshData.pages || {}
  ;(context as any).freshData.pages[data.id] = data

  const dependentUpdates = getDependentUpdatesContext(context)

  if (await shouldTriggerArchiveDependentUpdates(collection.slug, data, originalDoc)) {
    const dependencies = await getArchiveChildCollections(data.id)

    dependentUpdates.push({
      operation: "archive-page-update",
      entityId: data.id,
      additionalData: {
        oldSlug: originalDoc?.slug,
        newSlug: data.slug,
        affectedCollections: dependencies.map(dep => dep.collection),
      },
    })
  }

  if (await shouldTriggerHierarchyDependentUpdates(collection.slug, data, originalDoc)) {
    const hierarchyChanges = detectHierarchyChanges(data, originalDoc)

    dependentUpdates.push({
      operation: "page-hierarchy-update",
      entityId: data.id,
      additionalData: {
        oldParent: hierarchyChanges.oldParent,
        newParent: hierarchyChanges.newParent,
      },
    })
  }

  return data
}
