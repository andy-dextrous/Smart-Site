/**
 * Generate a cryptographically secure UUID v4
 *
 * Replaces the previous Math.random() based implementation with
 * the built-in crypto.randomUUID() for:
 * - Cryptographic security (uses OS random source)
 * - Zero collision risk (122 bits of randomness)
 * - RFC 4122 compliance
 * - Native performance
 *
 * @returns A UUID v4 string (e.g., "123e4567-e89b-12d3-a456-426614174000")
 */
export const uuid = (): string => {
  return crypto.randomUUID()
}
