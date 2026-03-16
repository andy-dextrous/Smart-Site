import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"

/*************************************************************************/
/*  SMARTSITE LOCAL TOOLING HELPERS
/*************************************************************************/

const LOCAL_DATABASE_URL = "mongodb://127.0.0.1:27017/smart-site-dev"
const DEFAULT_PUBLIC_URL = "http://localhost:3000"

export function getProjectPaths(projectRoot = process.cwd()) {
  return {
    projectRoot,
    envPath: path.join(projectRoot, ".env"),
    envExamplePath: path.join(projectRoot, ".env.example"),
    configPath: path.join(projectRoot, "src", "smartsite.config.ts"),
    manifestPath: path.join(projectRoot, "smartsite-deployment.json"),
    generatedProductionEnvPath: path.join(
      projectRoot,
      ".smartsite-self-hosted",
      "generated",
      "production.env",
    ),
  }
}

export function fileExists(targetPath) {
  return fs.existsSync(targetPath)
}

export function readText(targetPath) {
  return fs.readFileSync(targetPath, "utf8")
}

export function writeText(targetPath, value) {
  fs.writeFileSync(targetPath, value, "utf8")
}

export function copyEnvExampleIfMissing(paths) {
  if (fileExists(paths.envPath)) {
    return false
  }

  if (!fileExists(paths.envExamplePath)) {
    throw new Error(`Missing env template at ${paths.envExamplePath}`)
  }

  fs.copyFileSync(paths.envExamplePath, paths.envPath)
  return true
}

export function randomHex(bytes) {
  return crypto.randomBytes(bytes).toString("hex")
}

export function parseEnv(text) {
  const values = {}
  const lines = text.split(/\r?\n/)

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith("#")) {
      continue
    }

    const separator = line.indexOf("=")
    if (separator === -1) {
      continue
    }

    const key = line.slice(0, separator).trim()
    const rawValue = line.slice(separator + 1).trim()
    let value = rawValue

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    } else {
      value = value.replace(/\s*#.*$/, "").trim()
    }

    values[key] = value
  }

  return values
}

function normalizeEnvLineValue(value) {
  if (value === undefined || value === null) {
    return ""
  }

  return String(value)
}

export function upsertEnvValues(text, updates) {
  const lines = text.split(/\r?\n/)
  const pending = new Map(Object.entries(updates))
  const updatedLines = lines.map(line => {
    const separator = line.indexOf("=")

    if (separator === -1) {
      return line
    }

    const key = line.slice(0, separator).trim()

    if (!pending.has(key)) {
      return line
    }

    const nextValue = normalizeEnvLineValue(pending.get(key))
    pending.delete(key)
    return `${key}=${nextValue}`
  })

  if (pending.size > 0) {
    if (updatedLines.length > 0 && updatedLines[updatedLines.length - 1] !== "") {
      updatedLines.push("")
    }

    for (const [key, value] of pending.entries()) {
      updatedLines.push(`${key}=${normalizeEnvLineValue(value)}`)
    }
  }

  return updatedLines.join("\n")
}

export function detectHostingMode(paths) {
  const hasManifest = fileExists(paths.manifestPath)
  const hasGeneratedProductionEnv = fileExists(paths.generatedProductionEnvPath)

  return {
    mode: hasManifest ? "self-hosted" : "hosted-or-local",
    hasManifest,
    hasGeneratedProductionEnv,
  }
}

export function readAiEnabled(configText) {
  const match = configText.match(/ai:\s*{\s*enabled:\s*(true|false)/m)

  if (!match) {
    return null
  }

  return match[1] === "true"
}

export function readSiteName(configText) {
  const match = configText.match(/identity:\s*{[\s\S]*?siteName:\s*"([^"]+)"/m)

  if (!match) {
    return null
  }

  return match[1]
}

export function createSeedSiteId({ payloadSecret, publicUrl, siteName }) {
  const payload = [
    "smartsite-seed-site-id",
    (siteName || "").trim(),
    (publicUrl || "").trim(),
    (payloadSecret || "").trim(),
  ].join("|")

  return crypto.createHash("sha256").update(payload).digest("hex").slice(0, 24)
}

export function createSeedProof({ payloadSecret, previewSecret, publicUrl, siteName }) {
  const siteId = createSeedSiteId({ payloadSecret, publicUrl, siteName })
  const payload = [
    "smartsite-seed-proof",
    siteId,
    (payloadSecret || "").trim(),
    (previewSecret || "").trim(),
  ].join("|")

  return crypto.createHash("sha256").update(payload).digest("hex")
}

export function setAiEnabled(configText, enabled) {
  const nextValue = enabled ? "true" : "false"

  if (/ai:\s*{\s*enabled:\s*(true|false)/m.test(configText)) {
    return configText.replace(/(ai:\s*{\s*enabled:\s*)(true|false)/m, `$1${nextValue}`)
  }

  if (!/features:\s*{/m.test(configText)) {
    throw new Error("Could not find features block in src/smartsite.config.ts")
  }

  return configText.replace(
    /features:\s*{/m,
    `features: {\n    ai: {\n      enabled: ${nextValue},\n    },`,
  )
}

export function setSiteName(configText, siteName) {
  const escaped = String(siteName).replace(/"/g, '\\"')

  if (/(identity:\s*{[\s\S]*?siteName:\s*)"([^"]*)"/m.test(configText)) {
    return configText.replace(
      /(identity:\s*{[\s\S]*?siteName:\s*)"([^"]*)"/m,
      `$1"${escaped}"`,
    )
  }

  throw new Error("Could not find identity.siteName in src/smartsite.config.ts")
}

export function hasPlaceholderDatabaseUrl(value) {
  if (!value) {
    return true
  }

  return (
    value.includes("username:password@cluster-id") ||
    value.includes("<username>") ||
    value.includes("<cluster-url>") ||
    value.includes("database-name")
  )
}

export function isBlank(value) {
  return !value || value.trim().length === 0
}

export function deriveBootstrapEnvUpdates(currentEnv) {
  const updates = {}

  if (isBlank(currentEnv.DATABASE_PROVIDER)) {
    updates.DATABASE_PROVIDER = "mongoose"
  }

  if (hasPlaceholderDatabaseUrl(currentEnv.DATABASE_URL)) {
    updates.DATABASE_URL = LOCAL_DATABASE_URL
  }

  if (isBlank(currentEnv.NEXT_PUBLIC_URL)) {
    updates.NEXT_PUBLIC_URL = DEFAULT_PUBLIC_URL
  }

  if (isBlank(currentEnv.PAYLOAD_SECRET)) {
    updates.PAYLOAD_SECRET = randomHex(32)
  }

  if (isBlank(currentEnv.PREVIEW_SECRET)) {
    updates.PREVIEW_SECRET = randomHex(16)
  }

  return updates
}

export function summarizeEnvHealth(currentEnv) {
  return {
    hasDatabaseProvider: !isBlank(currentEnv.DATABASE_PROVIDER),
    hasDatabaseUrl: !hasPlaceholderDatabaseUrl(currentEnv.DATABASE_URL),
    hasPayloadSecret: !isBlank(currentEnv.PAYLOAD_SECRET),
    hasPreviewSecret: !isBlank(currentEnv.PREVIEW_SECRET),
    hasPublicUrl: !isBlank(currentEnv.NEXT_PUBLIC_URL),
    hasAdminEmail: !isBlank(currentEnv.PAYLOAD_ADMIN_EMAIL),
    hasAdminPassword: !isBlank(currentEnv.PAYLOAD_ADMIN_PASSWORD),
    hasAiApiKey: !isBlank(currentEnv.AI_AGENT_API_KEY),
  }
}

export function inferDatabaseTarget(databaseUrl) {
  if (isBlank(databaseUrl)) {
    return "missing"
  }

  if (databaseUrl.startsWith("mongodb://mongo")) {
    return "self-hosted-mongo"
  }

  if (databaseUrl.startsWith("mongodb://127.0.0.1") || databaseUrl.startsWith("mongodb://localhost")) {
    return "local-mongo"
  }

  if (databaseUrl.startsWith("mongodb+srv://")) {
    return "managed-mongo"
  }

  if (databaseUrl.startsWith("mongodb://")) {
    return "mongo"
  }

  return "unknown"
}
