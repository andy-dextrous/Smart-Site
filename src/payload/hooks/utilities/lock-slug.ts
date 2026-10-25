import type { CollectionBeforeOperationHook, CollectionSlug } from "payload"

export function lockSlugAfterPublish<TSlug extends CollectionSlug>(
  arg: Parameters<CollectionBeforeOperationHook<TSlug>>[0]
): ReturnType<CollectionBeforeOperationHook<TSlug>> {
  const { args } = arg

  if ("data" in args && args.data && typeof args.data === "object") {
    const data = args.data as {
      _status?: string
      hasBeenPublished?: boolean
      slugLock?: boolean
    }

    if (data._status === "published") {
      data.slugLock = true
      data.hasBeenPublished = true
    }
  }

  return args
}
