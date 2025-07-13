import merge from "lodash.merge"

/**
 * Deep merge utility using lodash.merge for enterprise-grade reliability
 *
 * Replaces the previous custom implementation that used @ts-nocheck
 * and had limited type safety. This version provides:
 * - Full TypeScript support
 * - Proper array handling
 * - Battle-tested implementation
 * - Multiple source support
 *
 * @param target - The target object to merge into
 * @param source - The source object to merge from
 * @returns Deeply merged object maintaining target type structure
 */
export default function deepMerge<T>(target: T, source: Partial<T>): T {
  return merge({}, target, source) as T
}

/**
 * Type guard for object checking (kept for compatibility)
 * @param item - Item to check
 * @returns True if item is a plain object
 */
export function isObject(item: unknown): item is object {
  return typeof item === "object" && !Array.isArray(item) && item !== null
}
