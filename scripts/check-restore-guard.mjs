import fs from "fs"
import path from "path"

/*************************************************************************/
/*  ARGUMENTS
/*************************************************************************/

function readArgs(argv) {
  const args = {
    archive: "",
    envFile: "",
    force: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index]
    const next = argv[index + 1]

    if (current === "--archive" && next) {
      args.archive = next
      index += 1
      continue
    }

    if (current === "--env-file" && next) {
      args.envFile = next
      index += 1
      continue
    }

    if (current === "--force") {
      args.force = true
    }
  }

  return args
}

/*************************************************************************/
/*  HELPERS
/*************************************************************************/

function parseEnv(content) {
  const values = {}

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()

    if (!line || line.startsWith("#")) {
      continue
    }

    const separatorIndex = line.indexOf("=")

    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim().replace(/^"(.*)"$/, "$1")
    values[key] = value
  }

  return values
}

function resolveMetadataPath(archivePath) {
  if (archivePath.endsWith(".archive.gz")) {
    return archivePath.replace(/\.archive\.gz$/, ".meta.json")
  }

  return `${archivePath}.meta.json`
}

function loadMetadata(metadataPath) {
  if (!fs.existsSync(metadataPath)) {
    return null
  }

  return JSON.parse(fs.readFileSync(metadataPath, "utf8"))
}

function readLatestTargetMetadata(backupRoot) {
  if (!backupRoot || !fs.existsSync(backupRoot)) {
    return null
  }

  const entries = fs
    .readdirSync(backupRoot)
    .filter(entry => entry.endsWith(".meta.json"))
    .sort()
    .reverse()

  if (entries.length === 0) {
    return null
  }

  const latestPath = path.join(backupRoot, entries[0])
  return loadMetadata(latestPath)
}

function toTimestamp(value) {
  if (!value) {
    return 0
  }

  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

/*************************************************************************/
/*  GUARD
/*************************************************************************/

function main() {
  const options = readArgs(process.argv.slice(2))

  if (!options.archive || !options.envFile) {
    throw new Error("Usage: node scripts/check-restore-guard.mjs --archive <path> --env-file <path> [--force]")
  }

  const archivePath = path.resolve(process.cwd(), options.archive)
  const envPath = path.resolve(process.cwd(), options.envFile)
  const envValues = parseEnv(fs.readFileSync(envPath, "utf8"))
  const runtimeEnv = envValues.SMARTSITE_RUNTIME_ENV || "production"
  const backupRoot = path.resolve(process.cwd(), envValues.SMARTSITE_BACKUP_DIR || ".smartsite-self-hosted/backups/production")
  const sourceMetadata = loadMetadata(resolveMetadataPath(archivePath))
  const targetMetadata = readLatestTargetMetadata(backupRoot)

  if (runtimeEnv !== "production") {
    if (sourceMetadata) {
      console.log(`Source archive timestamp: ${sourceMetadata.createdAt}`)
    }

    if (targetMetadata) {
      console.log(`Latest ${runtimeEnv} backup timestamp: ${targetMetadata.createdAt}`)
    }

    return
  }

  if (!sourceMetadata && !options.force) {
    throw new Error(
      "Source archive metadata is missing. Create the archive with `pnpm self-hosted:dump` or re-run with --force if you intend to bypass freshness checks.",
    )
  }

  if (!sourceMetadata || !targetMetadata) {
    if (options.force) {
      return
    }

    throw new Error("Could not verify restore freshness. Re-run with --force only if you have manually confirmed source and target state.")
  }

  const sourceTimestamp = toTimestamp(sourceMetadata.createdAt)
  const targetTimestamp = toTimestamp(targetMetadata.createdAt)

  if (sourceTimestamp < targetTimestamp && !options.force) {
    throw new Error(
      `Refusing to overwrite production with an older archive. Source snapshot: ${sourceMetadata.createdAt}. Latest production snapshot: ${targetMetadata.createdAt}. Re-run with --force only if the downgrade is intentional.`,
    )
  }

  if (sourceMetadata.databaseName && envValues.MONGO_INITDB_DATABASE && sourceMetadata.databaseName !== envValues.MONGO_INITDB_DATABASE && !options.force) {
    throw new Error(
      `Refusing to restore archive for database '${sourceMetadata.databaseName}' into '${envValues.MONGO_INITDB_DATABASE}'. Re-run with --force only if this cross-database restore is intentional.`,
    )
  }

  console.log(`Source archive timestamp: ${sourceMetadata.createdAt}`)
  console.log(`Latest production backup timestamp: ${targetMetadata.createdAt}`)
}

main()
