import { revalidateDocument, revalidateCollection } from "@/admin/cache/revalidation"
import {
  detectAllSettingsChanges,
  detectHomepageChange,
} from "@/admin/routing/dependency-detection"
import {
  getDependentUpdatesContext,
  clearDependentUpdatesContext,
  queueDependentUpdatesJob,
} from "@/admin/payload/hooks/utilities/context-management"
import { shouldPreventHooks } from "@/admin/utilities/prevent-hooks"
import { revalidateTag } from "next/cache"
import type { GlobalAfterChangeHook } from "payload"

/*************************************************************************/
/*  SETTINGS-SPECIFIC AFTER CHANGE HOOK
/*
/*  Handles settings cascade detection with direct database access
/*
/*  This hook:
/*  - Detects homepage designation changes
/*  - Identifies archive page assignment changes affecting entire collections
/*  - Handles template assignment changes
/*  - Queues batched jobs for site-wide URI regeneration
/*  - Uses DIRECT database access (NO CACHING) for data consistency
/*  - Stores fresh settings in Payload context for job processing
/*************************************************************************/

export const afterSettingsChange: GlobalAfterChangeHook = async ({
  doc,
  previousDoc,
  req: { payload, context },
  global,
}) => {
  if (shouldPreventHooks(payload, context)) {
    return doc
  }

  if (previousDoc) {
    // Store fresh settings in context for job processing
    context.freshData = {
      settings: doc,
      ...(context.freshData || {}),
    }

    const dependentUpdates = getDependentUpdatesContext(context)
    const settingsChanges = detectAllSettingsChanges(previousDoc, doc)

    if (settingsChanges.homepageChange) {
      const homepageChange = detectHomepageChange(previousDoc, doc)

      if (homepageChange.changed) {
        dependentUpdates.push({
          operation: "homepage-change",
          entityId: homepageChange.newHomepage || "unknown",
          additionalData: {
            oldHomepage: homepageChange.oldHomepage,
            newHomepage: homepageChange.newHomepage,
          },
        })
      }
    }

    if (settingsChanges.archiveChanges?.length > 0) {
      // Process archive page revalidations immediately (not in background job)
      const archivePromises = settingsChanges.archiveChanges.map(async change => {
        try {
          if (shouldPreventHooks(payload, context)) {
            return
          }

          payload.logger.info(
            `📋 Processing archive change for collection: ${change.collection}`
          )
          await revalidateCollection(change.collection, "archive-page-change")

          if (change.newArchive) {
            try {
              const archivePage = await payload.findByID({
                collection: "pages",
                id: change.newArchive,
                depth: 0,
                overrideAccess: true,
              })

              if (archivePage) {
                if (shouldPreventHooks(payload, context)) {
                  return
                } else {
                  await revalidateDocument({
                    collection: "pages",
                    doc: archivePage,
                    action: "create",
                    logger: payload.logger,
                  })
                }
              } else {
                payload.logger.warn(`Archive page not found: ${change.newArchive}`)
              }
            } catch (error) {
              payload.logger.error(
                `Failed to revalidate archive page ${change.newArchive}:`,
                error
              )
            }
          }
        } catch (error) {
          payload.logger.error(
            `Failed to process archive change for collection ${change.collection}:`,
            error
          )
        }
      })

      await Promise.allSettled(archivePromises)

      // Queue batched dependent update for archive changes
      dependentUpdates.push({
        operation: "settings-change",
        entityId: doc.id,
        additionalData: {
          affectedCollections: settingsChanges.archiveChanges.map(
            change => change.collection
          ),
          freshSettings: doc, // Pass fresh settings data
        },
      })
    }

    if (settingsChanges.templateChanges?.length > 0) {
      // Process template revalidations immediately (not in background job)
      const templatePromises = settingsChanges.templateChanges.map(async change => {
        try {
          if (shouldPreventHooks(payload, context)) {
            return
          }

          await revalidateCollection(change.collection, "template-change")
        } catch (error) {
          payload.logger.error(
            `Failed to revalidate collection ${change.collection} for template change:`,
            error
          )
        }
      })

      await Promise.allSettled(templatePromises)

      // Queue batched dependent update for template changes
      dependentUpdates.push({
        operation: "template-change",
        entityId: doc.id,
        additionalData: {
          affectedCollections: settingsChanges.templateChanges.map(
            change => change.collection
          ),
          templateChanges: settingsChanges.templateChanges,
          freshSettings: doc, // Pass fresh settings to prevent stale template lookups
        },
      })
    }

    // Handle non-routing settings changes with full cache refresh
    if (
      settingsChanges.generalChanges ||
      settingsChanges.socialChanges ||
      settingsChanges.locationChanges
    ) {
      try {
        const { revalidateAll } = await import("@/admin/cache/revalidation")
        await revalidateAll()
        payload.logger.info(
          "📋 Non-routing settings changed - full cache refresh triggered"
        )
      } catch (error) {
        payload.logger.error("Failed to revalidate after settings change:", error)
      }
    }

    // Execute all dependent updates as a single batch
    if (dependentUpdates.length > 0) {
      await queueDependentUpdatesJob(dependentUpdates, payload)
      clearDependentUpdatesContext(context)
    }
  }

  if (shouldPreventHooks(payload, context)) {
    return doc
  }

  try {
    revalidateTag(`global:${global.slug}`)
    payload.logger.info(`Revalidated global:${global.slug}`)
  } catch (error) {
    payload.logger.error(`Revalidation failed for global ${global.slug}:`, error)
  }

  return doc
}
