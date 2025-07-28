import {
  getDependentUpdatesContext,
  clearDependentUpdatesContext,
  queueDependentUpdatesJob,
} from "@/admin/payload/hooks/utilities/context-management"
import { shouldPreventHooks } from "@/admin/utilities/prevent-hooks"
import { revalidateTag } from "next/cache"
import type { CollectionAfterChangeHook } from "payload"

/*************************************************************************/
/*  TEMPLATES-SPECIFIC AFTER CHANGE HOOK
/*
/*  Handles template content changes and dependent updates
/*
/*  This hook:
/*  - Detects when template sections have changed
/*  - Queues dependent updates for content using changed templates
/*  - Handles template-specific revalidation
/*  - Only runs for templates collection
/*  - Uses direct database access (no caching) for data consistency
/*************************************************************************/

export const afterTemplateChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req: { payload, context },
  collection,
}) => {
  if (collection.slug !== "templates") return doc

  if (shouldPreventHooks(payload, context)) {
    return doc
  }

  if (previousDoc) {
    const dependentUpdates = getDependentUpdatesContext(context)

    const previousSections = JSON.stringify(previousDoc.sections || [])
    const currentSections = JSON.stringify(doc.sections || [])

    if (previousSections !== currentSections) {
      payload.logger.info(
        `Template content changed for ${doc.name}. Queuing dependent updates.`
      )

      dependentUpdates.push({
        operation: "template-content-change",
        entityId: doc.id,
        additionalData: {
          templateId: doc.id,
          templateName: doc.name,
        },
      })
    }

    if (dependentUpdates.length > 0) {
      await queueDependentUpdatesJob(dependentUpdates, payload)
      clearDependentUpdatesContext(context)
    }
  }

  try {
    revalidateTag(`template:${doc.id}`)
    payload.logger.info(`Revalidated template:${doc.id}`)
  } catch (error) {
    payload.logger.debug(`Template revalidation failed for ${doc.id}:`, error)
  }

  return doc
}
