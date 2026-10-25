/*************************************************************************/
/*  SANITIZE PAYLOAD DATA UTILITY
/*************************************************************************/

type SerializableRecord = Record<string | number | symbol, unknown>

type SeenMap = WeakMap<object, unknown>

/**
 * Recursively transforms Payload responses so they can cross the server/client boundary.
 */
export function sanitizePayloadData<T>(input: T): T {
  return sanitizeValue(input, new WeakMap()) as T
}

function sanitizeValue(value: unknown, seen: SeenMap): unknown {
  if (value === null || typeof value !== "object") {
    return value
  }

  if (isBsonObjectId(value)) {
    return coerceObjectIdToString(value)
  }

  if (
    typeof (value as { toJSON?: () => unknown }).toJSON === "function" &&
    isBsonLike(value)
  ) {
    const jsonValue = (value as { toJSON: () => unknown }).toJSON()
    return sanitizeValue(jsonValue, seen)
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (value instanceof URL) {
    return value.toString()
  }

  if (typeof Buffer !== "undefined" && value instanceof Buffer) {
    return value.toString("base64")
  }

  if (Array.isArray(value)) {
    return value.map(item => sanitizeValue(item, seen))
  }

  if (value instanceof Set) {
    return Array.from(value).map(item => sanitizeValue(item, seen))
  }

  if (value instanceof Map) {
    const entries = Array.from(value.entries()).map(([key, entryValue]) => [
      key,
      sanitizeValue(entryValue, seen),
    ])
    return Object.fromEntries(entries)
  }

  if (seen.has(value as object)) {
    return seen.get(value as object)
  }

  const output: SerializableRecord = {}
  seen.set(value as object, output)

  for (const key of Reflect.ownKeys(value as SerializableRecord)) {
    const sanitized = sanitizeValue((value as SerializableRecord)[key], seen)
    if (sanitized !== undefined) {
      output[key] = sanitized
    }
  }

  return output
}

function isBsonObjectId(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false
  }

  const bsonCandidate = value as { _bsontype?: unknown }

  if (typeof bsonCandidate._bsontype === "string") {
    return bsonCandidate._bsontype.toLowerCase() === "objectid"
  }

  const constructorCandidate = value as { constructor?: { name?: string } }

  return constructorCandidate.constructor?.name === "ObjectId"
}

function isBsonLike(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false
  }

  const bsonType = (value as { _bsontype?: unknown })._bsontype
  return typeof bsonType === "string"
}

function coerceObjectIdToString(value: unknown): string {
  const candidate = value as {
    toHexString?: () => string
    toString?: () => string
    valueOf?: () => unknown
    id?: { buffer?: ArrayLike<number> } | ArrayLike<number>
  }

  if (typeof candidate.toHexString === "function") {
    return candidate.toHexString()
  }

  if (typeof candidate.toString === "function") {
    const stringValue = candidate.toString()
    if (stringValue && stringValue !== "[object Object]") {
      return stringValue
    }
  }

  if (candidate.id) {
    if (typeof Buffer !== "undefined" && candidate.id instanceof Buffer) {
      return candidate.id.toString("hex")
    }

    const bufferLike =
      (candidate.id as { buffer?: ArrayLike<number> }).buffer || candidate.id
    if (bufferLike) {
      const bytes = Array.from(bufferLike as ArrayLike<number>)
      return bytes.map(byte => byte.toString(16).padStart(2, "0")).join("")
    }
  }

  if (typeof candidate.valueOf === "function") {
    const valueOfResult = candidate.valueOf()
    if (typeof valueOfResult === "string" && valueOfResult) {
      return valueOfResult
    }
  }

  return ""
}
