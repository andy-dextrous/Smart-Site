import { revalidateTag } from "next/cache"
import { executeRevalidates } from "next/dist/server/revalidation-utils"
import { workAsyncStorage } from "next/dist/server/app-render/work-async-storage.external"

export function hasPublicationCacheContext() {
  return Boolean(workAsyncStorage.getStore()?.incrementalCache)
}

/** Pinned Next 16.3.3 bridge: revalidateTag schedules, it does not acknowledge delivery.
 * Keep this isolated and production-tested when upgrading Next. Never call from a Node worker.
 */
export async function deliverPublicationCache() {
  const store = workAsyncStorage.getStore()
  if (!store?.incrementalCache)
    throw new Error("Publication cache delivery requires a Next Route Handler")
  revalidateTag("all", { expire: 0 })
  await executeRevalidates(store)
}
