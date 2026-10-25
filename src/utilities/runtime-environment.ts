function normalizeBoolean(value: string | undefined) {
  if (!value) {
    return false
  }

  return value === "1" || value === "true" || value === "yes"
}

export function getRuntimeEnvironment() {
  if (process.env.SMARTSITE_RUNTIME_ENV) {
    return process.env.SMARTSITE_RUNTIME_ENV
  }

  if (process.env.VERCEL_ENV === "production") {
    return "production"
  }

  if (process.env.VERCEL_ENV === "preview") {
    return "staging"
  }

  return process.env.NODE_ENV === "production" ? "production" : "development"
}

export function allowSearchIndexing() {
  if (typeof process.env.SMARTSITE_ALLOW_INDEXING !== "undefined") {
    return normalizeBoolean(process.env.SMARTSITE_ALLOW_INDEXING)
  }

  return process.env.VERCEL_ENV === "production"
}
