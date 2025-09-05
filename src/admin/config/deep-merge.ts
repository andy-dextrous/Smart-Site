/*************************************************************************/
/*  DEEP MERGE UTILITY FOR CONFIGURATION
/*************************************************************************/

/**
 * Deep merge configuration objects with special handling for arrays
 * Arrays in extensions are replaced, not merged
 * All other properties are deeply merged
 */
export function deepMerge<T extends Record<string, any>>(
  target: T,
  source: any
): T {
  const result: any = { ...target }

  for (const key in source) {
    if (!Object.prototype.hasOwnProperty.call(source, key)) continue

    const sourceValue = source[key]
    const targetValue = target[key]

    // Handle null/undefined - source wins
    if (sourceValue === null || sourceValue === undefined) {
      result[key] = sourceValue
      continue
    }

    // Arrays in extensions are replaced, not merged
    if (key === "extensions" && Array.isArray(sourceValue)) {
      result[key] = sourceValue
      continue
    }

    // Arrays elsewhere are also replaced for simplicity
    if (Array.isArray(sourceValue)) {
      result[key] = sourceValue
      continue
    }

    // Objects are deeply merged
    if (
      typeof sourceValue === "object" &&
      !Array.isArray(sourceValue) &&
      sourceValue !== null &&
      typeof targetValue === "object" &&
      !Array.isArray(targetValue) &&
      targetValue !== null
    ) {
      result[key] = deepMerge(targetValue, sourceValue)
      continue
    }

    // Primitives - source wins
    result[key] = sourceValue
  }

  return result as T
}

/**
 * Freeze configuration object to prevent mutations
 */
export function deepFreeze<T>(obj: T): T {
  Object.freeze(obj)

  Object.getOwnPropertyNames(obj).forEach(prop => {
    const value = (obj as any)[prop]
    if (value !== null && (typeof value === "object" || typeof value === "function") && !Object.isFrozen(value)) {
      deepFreeze(value)
    }
  })

  return obj
}