import fs from "fs"
import path from "path"
import { inspectGitState } from "./inspect-git-state.mjs"

/*************************************************************************/
/*  ARGUMENTS
/*************************************************************************/

function readArgs(argv) {
  const args = {
    archive: "",
    envFile: "",
    runtimeEnv: "",
    sourceKind: "",
    databaseName: "",
    publicUrl: "",
    deploymentId: "",
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

    if (current === "--runtime-env" && next) {
      args.runtimeEnv = next
      index += 1
      continue
    }

    if (current === "--source-kind" && next) {
      args.sourceKind = next
      index += 1
      continue
    }

    if (current === "--database-name" && next) {
      args.databaseName = next
      index += 1
      continue
    }

    if (current === "--public-url" && next) {
      args.publicUrl = next
      index += 1
      continue
    }

    if (current === "--deployment-id" && next) {
      args.deploymentId = next
      index += 1
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

/*************************************************************************/
/*  METADATA
/*************************************************************************/

function buildMetadata(options) {
  const envValues =
    options.envFile && fs.existsSync(options.envFile)
      ? parseEnv(fs.readFileSync(options.envFile, "utf8"))
      : {}
  const git = inspectGitState(process.cwd())

  return {
    createdAt: new Date().toISOString(),
    archiveFile: path.basename(options.archive),
    sourceKind: options.sourceKind || "manual",
    runtimeEnv: options.runtimeEnv || envValues.SMARTSITE_RUNTIME_ENV || "manual",
    databaseName:
      options.databaseName || envValues.MONGO_INITDB_DATABASE || envValues.DATABASE_NAME || "",
    publicUrl: options.publicUrl || envValues.NEXT_PUBLIC_URL || "",
    deploymentId: options.deploymentId || envValues.NEXT_DEPLOYMENT_ID || "",
    git,
  }
}

function main() {
  const options = readArgs(process.argv.slice(2))

  if (!options.archive) {
    throw new Error("Missing required argument: --archive")
  }

  const archivePath = path.resolve(process.cwd(), options.archive)
  const metadataPath = resolveMetadataPath(archivePath)
  const metadata = buildMetadata({
    ...options,
    archive: archivePath,
    envFile: options.envFile ? path.resolve(process.cwd(), options.envFile) : "",
  })

  fs.writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`)
  console.log(`Wrote ${path.relative(process.cwd(), metadataPath)}`)
}

main()
