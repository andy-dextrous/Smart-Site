import { spawnSync } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

const DEFAULT_PROTECTED_COLLECTIONS = [
  "form-submissions",
  "users",
  "orders",
  "analytics",
  "payments",
  "payload-preferences",
  "payload-jobs",
  "payload-queued",
  "payload-versions",
  "payload-sessions",
]

const DEFAULT_PROTECTED_PATTERNS = ["payload-*", "payload_*", "_payload*"]

/*************************************************************************/
/*  CONFIGURATION HELPERS
/*************************************************************************/

function resolveProjectRoot() {
  const currentDir = fileURLToPath(new URL(".", import.meta.url))
  return path.resolve(currentDir, "..", "..")
}

function loadSyncConfig(projectRoot) {
  const defaultConfig = {
    database: {},
    protectedCollections: DEFAULT_PROTECTED_COLLECTIONS,
    protectedCollectionPatterns: DEFAULT_PROTECTED_PATTERNS,
  }

  const configPath = path.join(projectRoot, "staging-sync.config.json")

  if (!existsSync(configPath)) {
    return defaultConfig
  }

  const parsed = JSON.parse(readFileSync(configPath, "utf8"))
  const databaseConfig = parsed.database && typeof parsed.database === "object" ? parsed.database : {}
  const protectedCollections = new Set(defaultConfig.protectedCollections)

  if (Array.isArray(parsed.protectedCollections)) {
    for (const collection of parsed.protectedCollections) {
      if (typeof collection === "string" && collection.trim().length > 0) {
        protectedCollections.add(collection.trim())
      }
    }
  }

  const protectedPatterns = new Set(defaultConfig.protectedCollectionPatterns)

  if (Array.isArray(parsed.protectedCollectionPatterns)) {
    for (const pattern of parsed.protectedCollectionPatterns) {
      if (typeof pattern === "string" && pattern.trim().length > 0) {
        protectedPatterns.add(pattern.trim())
      }
    }
  }

  return {
    database: databaseConfig,
    protectedCollections: Array.from(protectedCollections),
    protectedCollectionPatterns: Array.from(protectedPatterns),
  }
}

function resolveDatabaseName(uri, fallbackName) {
  try {
    const parsed = new URL(uri)
    const pathname = parsed.pathname.replace(/^\//, "").trim()
    if (pathname.length > 0) {
      return pathname
    }
  } catch (error) {}

  if (fallbackName) {
    return fallbackName
  }

  if (process.env.SMARTSITE_DATABASE_NAME) {
    return process.env.SMARTSITE_DATABASE_NAME
  }

  if (process.env.DATABASE_NAME) {
    return process.env.DATABASE_NAME
  }

  return ""
}

function ensureDatabase(uri, dbName) {
  try {
    const parsed = new URL(uri)
    if (parsed.pathname && parsed.pathname !== "/") {
      return uri
    }
    parsed.pathname = `/${dbName}`
    return parsed.toString()
  } catch (error) {
    const normalized = uri.replace(/\/+$/, "")
    return `${normalized}/${dbName}`
  }
}

function resolveEnvironment(config) {
  const productionUri = process.env.DATABASE_URL
  const stagingUri = process.env.STAGING_DATABASE_URL

  if (!productionUri) {
    throw new Error("DATABASE_URL is not defined")
  }

  if (!stagingUri) {
    throw new Error("STAGING_DATABASE_URL is not defined")
  }

  const productionName = resolveDatabaseName(productionUri, config.database.prod)
  const stagingName = resolveDatabaseName(stagingUri, config.database.staging || productionName)

  if (!productionName) {
    throw new Error("Unable to determine production database name")
  }

  if (!stagingName) {
    throw new Error("Unable to determine staging database name")
  }

  return {
    production: {
      uri: ensureDatabase(productionUri, productionName),
      name: productionName,
    },
    staging: {
      uri: ensureDatabase(stagingUri, stagingName),
      name: stagingName,
    },
  }
}

/*************************************************************************/
/*  SHELL HELPERS
/*************************************************************************/

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
  })

  if (result.error) {
    throw result.error
  }

  if (typeof result.status === "number" && result.status !== 0) {
    throw new Error(`${command} exited with code ${result.status}`)
  }
}

function createTempDir() {
  return mkdtempSync(path.join(os.tmpdir(), "smartsite-staging-sync-"))
}

function cleanupTempDir(tempDir) {
  rmSync(tempDir, { recursive: true, force: true })
}

/*************************************************************************/
/*  SYNC OPERATIONS
/*************************************************************************/

function appendDumpExcludes(args, dbName, config) {
  for (const collection of config.protectedCollections) {
    args.push("--excludeCollection", collection)
  }

  for (const pattern of config.protectedCollectionPatterns) {
    if (pattern.endsWith("*")) {
      const prefix = pattern.slice(0, -1)
      if (prefix.length > 0) {
        args.push("--excludeCollectionsWithPrefix", prefix)
      }
      continue
    }

    args.push("--excludeCollection", pattern)
  }

  args.push("--db", dbName)
}

function appendRestoreExcludes(args, dbName, config) {
  for (const collection of config.protectedCollections) {
    args.push("--nsExclude", `${dbName}.${collection}`)
  }

  for (const pattern of config.protectedCollectionPatterns) {
    args.push("--nsExclude", `${dbName}.${pattern}`)
  }
}

function dumpDatabase(source, tempDir, config) {
  const args = ["--uri", source.uri, "--out", tempDir]

  appendDumpExcludes(args, source.name, config)

  run("mongodump", args)
}

function restoreDatabase(target, dumpDir, config) {
  const args = ["--uri", target.uri, "--dir", dumpDir, "--drop"]

  appendRestoreExcludes(args, target.name, config)

  run("mongorestore", args)
}

function pullProductionIntoStaging(environment, config) {
  const tempDir = createTempDir()

  try {
    dumpDatabase(environment.production, tempDir, config)
    const dumpDir = path.join(tempDir, environment.production.name)
    restoreDatabase(environment.staging, dumpDir, config)
  } finally {
    cleanupTempDir(tempDir)
  }
}

function pushStagingIntoProduction(environment, config) {
  const tempDir = createTempDir()

  try {
    dumpDatabase(environment.staging, tempDir, config)
    const dumpDir = path.join(tempDir, environment.staging.name)
    restoreDatabase(environment.production, dumpDir, config)
  } finally {
    cleanupTempDir(tempDir)
  }
}

/*************************************************************************/
/*  ENTRYPOINT
/*************************************************************************/

function main() {
  const command = process.argv[2]

  if (!command || !["pull", "push"].includes(command)) {
    console.error("Usage: node ./scripts/db/staging-sync.mjs <pull|push>")
    process.exit(1)
  }

  const projectRoot = resolveProjectRoot()
  const config = loadSyncConfig(projectRoot)
  const environment = resolveEnvironment(config)

  if (command === "pull") {
    pullProductionIntoStaging(environment, config)
    return
  }

  pushStagingIntoProduction(environment, config)
}

try {
  main()
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
