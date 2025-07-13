import type { CollectionBeforeOperationHook } from "payload"

export const lockSlugAfterPublish: CollectionBeforeOperationHook = ({
  operation,
  args,
}) => {
  if (operation === "update" && args.data._status === "published") {
    args.data.slugLock = true
    args.data.hasBeenPublished = true
  }

  return args
}
