import { deferHookAfterCommit } from "@/admin/payload/hooks/utilities/after-commit"
import {
  getDependentUpdatesContext,
  clearDependentUpdatesContext,
  queueDependentUpdatesJob,
} from "@/admin/payload/hooks/utilities/context-management"
import { shouldPreventHooks } from "@/admin/utilities/prevent-hooks"
import type { CollectionAfterChangeHook } from "payload"

/*************************************************************************/
/*  PAGES-SPECIFIC AFTER CHANGE HOOK
/*
/*  Handles dependent updates processing for pages collection
/*
/*  This hook:
/*  - Processes dependent updates queued by before-change hook
/*  - Executes background jobs for archive and hierarchy changes
/*  - Only runs for pages collection
/*  - Uses direct database access (no caching) for data consistency
/*************************************************************************/

export const afterPageChange: CollectionAfterChangeHook = async args => {
  if (deferHookAfterCommit(args, afterPageChange)) return args.doc
  const {
    doc,
    previousDoc,
    operation,
    req: { payload, context },
    collection,
  } = args

  if (collection.slug !== "pages") return doc

  if (shouldPreventHooks(payload, context)) {
    return doc
  }

  const dependentUpdates = getDependentUpdatesContext(context)

  if (dependentUpdates.length > 0) {
    await queueDependentUpdatesJob(dependentUpdates, payload)
    clearDependentUpdatesContext(context)
  }

  return doc
}
