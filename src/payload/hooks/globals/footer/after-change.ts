import { shouldPreventHooks } from "@/utilities/prevent-hooks"
import { revalidateTag } from "next/cache"
import type { GlobalAfterChangeHook } from "payload"

/*************************************************************************/
/*  FOOTER-SPECIFIC AFTER CHANGE HOOK
/*
/*  Handles footer-specific revalidation
/*
/*  This hook:
/*  - Handles revalidation for footer changes
/*  - Keeps footer logic separate from settings
/*  - Simple and focused functionality
/*************************************************************************/

export const afterFooterChange: GlobalAfterChangeHook = async ({
  doc,
  previousDoc,
  req: { payload, context },
  global,
}) => {
  if (global.slug !== "footer") return doc

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
