import { shouldPreventHooks } from "@/admin/utilities/prevent-hooks"
import { revalidateTag } from "next/cache"
import type { GlobalAfterChangeHook } from "payload"

/*************************************************************************/
/*  HEADER-SPECIFIC AFTER CHANGE HOOK
/*
/*  Handles header-specific revalidation
/*
/*  This hook:
/*  - Handles revalidation for header changes
/*  - Keeps header logic separate from settings
/*  - Simple and focused functionality
/*************************************************************************/

export const afterHeaderChange: GlobalAfterChangeHook = async ({
  doc,
  previousDoc,
  req: { payload, context },
  global,
}) => {
  if (global.slug !== "header") return doc

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
