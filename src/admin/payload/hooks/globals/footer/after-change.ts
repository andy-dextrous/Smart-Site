import { shouldPreventHooks } from "@/admin/utilities/prevent-hooks"
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
    revalidateTag(`global:${global.slug}`, { expire: 0 })
    payload.logger.info(`Revalidated global:${global.slug}`)
  } catch (error) {
    payload.logger.error({ error, slug: global.slug }, `Revalidation failed for global ${global.slug}`)
  }

  return doc
}
