import { deferHookAfterCommit } from "@/admin/payload/hooks/utilities/after-commit"
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

export const afterHeaderChange: GlobalAfterChangeHook = async args => {
  if (deferHookAfterCommit(args, afterHeaderChange)) return args.doc
  const {
    doc,
    previousDoc,
    req: { payload, context },
    global,
  } = args

  if (global.slug !== "header") return doc

  if (shouldPreventHooks(payload, context)) {
    return doc
  }

  try {
    revalidateTag(`global:${global.slug}`, { expire: 0 })
    payload.logger.info(`Revalidated global:${global.slug}`)
  } catch (error) {
    payload.logger.error(
      { error, slug: global.slug },
      `Revalidation failed for global ${global.slug}`
    )
  }

  return doc
}
