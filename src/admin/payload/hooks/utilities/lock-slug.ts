import type { CollectionBeforeOperationHook } from "payload"

export const lockSlugAfterPublish: CollectionBeforeOperationHook = ({ args }) => {
  if (args.data?._status === "published") {
    args.data.slugLock = true
    args.data.hasBeenPublished = true
  }

  return args
}
