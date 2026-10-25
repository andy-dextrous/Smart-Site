export { cache } from "@/website/cache/cache"

// Main revalidation system - all functions consolidated in one file
export {
  revalidateDocument as revalidate,
  batchRevalidateDocuments as batchRevalidate,
  revalidateGlobal,
  revalidateAll,
  revalidateCollection,
  type RevalidateOptions,
  type InvalidationResult,
  type BatchInvalidationSummary,
  type BatchRevalidateOptions,
  setRevalidationHandlers,
} from "@/website/cache/revalidation"
