import fs from "fs"
import os from "os"
import path from "path"
import { spawnSync } from "child_process"
import dotenv from "dotenv"
import { materializeSelfHostedEnv } from "./materialize-self-hosted-env.mjs"

const REMOTE_ENVIRONMENTS = new Set(["production", "preview"])
const TARGET_ENVIRONMENTS = new Set(["local", "preview"])

function readArgs(argv) {
  const normalized = argv[0] === "--" ? argv.slice(1) : argv
  const [source = "", target = "", ...rest] = normalized

  const args = {
    source,
    target,
    config: "smartsite-deployment.json",
    localEnv: ".env",
    sourceOverride: "",
    sshHost: process.env.SELF_HOSTED_HOST || "",
    sshUser: process.env.SELF_HOSTED_USER || "root",
    sshPath: process.env.SELF_HOSTED_PATH || "/opt/smartsite-self-hosted",
    archive: "",
    yes: false,
    force: false,
  }

  for (let index = 0; index < rest.length; index += 1) {
    const current = rest[index]
    const next = rest[index + 1]

    if (current === "--config" && next) {
      args.config = next
      index += 1
      continue
    }

    if (current === "--local-env" && next) {
      args.localEnv = next
      index += 1
      continue
    }

    if (current === "--source" && next) {
      args.sourceOverride = next
      index += 1
      continue
    }

    if (current === "--ssh-host" && next) {
      args.sshHost = next
      index += 1
      continue
    }

    if (current === "--ssh-user" && next) {
      args.sshUser = next
      index += 1
      continue
    }

    if (current === "--ssh-path" && next) {
      args.sshPath = next
      index += 1
      continue
    }

    if (current === "--archive" && next) {
      args.archive = next
      index += 1
      continue
    }

    if (current === "--yes") {
      args.yes = true
      continue
    }

    if (current === "--force") {
      args.force = true
    }
  }

  return args
}

function shellEscape(value) {
  return `'${String(value).replace(/'/g, `'\"'\"'`)}'`
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || process.cwd(),
    env: options.env || process.env,
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
  })

  if (result.status !== 0) {
    const details = options.capture ? `${result.stdout || ""}${result.stderr || ""}`.trim() : ""
    throw new Error(details ? `${command} ${args.join(" ")}\n${details}` : `${command} ${args.join(" ")}`)
  }

  return result
}

function ensureUsage(options) {
  if (!REMOTE_ENVIRONMENTS.has(options.source)) {
    throw new Error(
      "Usage: node scripts/run-self-hosted-data-pull.mjs <production|preview> <local|preview> [--config smartsite-deployment.json] [--local-env .env] [--ssh-host host] [--ssh-user user] [--ssh-path /opt/smartsite-self-hosted] [--archive file] [--yes] [--force]",
    )
  }

  if (!TARGET_ENVIRONMENTS.has(options.target)) {
    throw new Error(
      "Usage: node scripts/run-self-hosted-data-pull.mjs <production|preview> <local|preview> [--config smartsite-deployment.json] [--local-env .env] [--ssh-host host] [--ssh-user user] [--ssh-path /opt/smartsite-self-hosted] [--archive file] [--yes] [--force]",
    )
  }

  if (options.source === options.target) {
    throw new Error("Source and target environments must differ.")
  }

  if (!options.yes) {
    throw new Error("Refusing to overwrite target data without confirmation. Re-run with --yes.")
  }
}

function ensureRemoteConfiguration(options) {
  if (!options.sshHost) {
    throw new Error("Missing self-hosted runtime host. Set SELF_HOSTED_HOST or pass --ssh-host.")
  }
}

function resolveLocalEnvPath(projectDir, localEnv) {
  const envPath = path.resolve(projectDir, localEnv)

  if (!fs.existsSync(envPath)) {
    throw new Error(`Local env file not found: ${envPath}`)
  }

  return envPath
}

function resolveArchivePath(projectDir, archive, source, target) {
  if (archive) {
    return path.resolve(projectDir, archive)
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  return path.join(projectDir, ".smartsite-self-hosted", "backups", "pulls", `${timestamp}-${source}-to-${target}.archive.gz`)
}

function parseEnvFile(envPath) {
  return dotenv.parse(fs.readFileSync(envPath, "utf8"))
}

function resolveMetadataPath(archivePath) {
  return archivePath.endsWith(".archive.gz") ? archivePath.replace(/\.archive\.gz$/, ".meta.json") : `${archivePath}.meta.json`
}

function loadArchiveMetadata(archivePath) {
  const metadataPath = resolveMetadataPath(archivePath)

  if (!fs.existsSync(metadataPath)) {
    return null
  }

  return JSON.parse(fs.readFileSync(metadataPath, "utf8"))
}

function resolveDatabaseName(databaseUrl) {
  const match = String(databaseUrl || "").match(/\/([^/?]+)(?:\?|$)/)
  return match ? match[1] : ""
}

function resolveRootMongoUri(databaseUrl) {
  return String(databaseUrl || "").replace(/\/([^/?]+)(\?|$)/, "/$2")
}

function parseRemoteArchive(output) {
  const matches = [...output.matchAll(/^Wrote (.+)$/gm)]

  if (matches.length === 0) {
    throw new Error(`Could not determine remote archive path from output:\n${output}`)
  }

  return matches[matches.length - 1][1].trim()
}

function fetchRemoteArchive(options, sourceEnvironment, localArchivePath) {
  ensureRemoteConfiguration(options)
  const remoteEnvPath = `.smartsite-self-hosted/generated/${sourceEnvironment}.env`
  const remoteCommand = `cd ${shellEscape(options.sshPath)} && ./docker/backup-self-hosted.sh ${shellEscape(remoteEnvPath)}`
  const backupResult = run("ssh", [`${options.sshUser}@${options.sshHost}`, remoteCommand], { capture: true })
  const output = `${backupResult.stdout || ""}${backupResult.stderr || ""}`
  const remoteArchivePath = parseRemoteArchive(output)

  fs.mkdirSync(path.dirname(localArchivePath), { recursive: true })
  run("scp", [`${options.sshUser}@${options.sshHost}:${remoteArchivePath}`, localArchivePath])

  const remoteMetadataPath = remoteArchivePath.replace(/\.archive\.gz$/, ".meta.json")
  const localMetadataPath = localArchivePath.replace(/\.archive\.gz$/, ".meta.json")
  const metadataCheck = spawnSync("ssh", [`${options.sshUser}@${options.sshHost}`, `test -f ${shellEscape(remoteMetadataPath)}`], {
    encoding: "utf8",
    stdio: "ignore",
  })

  if (metadataCheck.status === 0) {
    run("scp", [`${options.sshUser}@${options.sshHost}:${remoteMetadataPath}`, localMetadataPath])
  }

  return remoteArchivePath
}

function backupLocalTarget(projectDir, envPath, label, force) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  const backupPath = path.join(projectDir, ".smartsite-self-hosted", "backups", "local", `${timestamp}-before-${label}.archive.gz`)

  try {
    run(path.join(projectDir, "docker", "create-mongo-archive.sh"), [envPath, backupPath])
    return backupPath
  } catch (error) {
    if (force) {
      console.warn(`Skipping local safety backup because it failed: ${error.message}`)
      return ""
    }

    throw new Error(`Failed to create local safety backup before restore.\n${error.message}`)
  }
}

function restoreLocalArchive(envPath, archivePath) {
  const envValues = parseEnvFile(envPath)
  const databaseUrl = envValues.DATABASE_URL
  const archiveMetadata = loadArchiveMetadata(archivePath)

  if (!databaseUrl) {
    throw new Error(`DATABASE_URL not found in ${envPath}`)
  }

  const targetDatabaseName = envValues.MONGO_INITDB_DATABASE || resolveDatabaseName(databaseUrl)
  const sourceDatabaseName = archiveMetadata?.databaseName || ""
  const restoreUri =
    sourceDatabaseName && targetDatabaseName && sourceDatabaseName !== targetDatabaseName
      ? resolveRootMongoUri(databaseUrl)
      : databaseUrl
  const args = [`--uri=${restoreUri}`, `--archive=${archivePath}`, "--gzip", "--drop"]

  if (sourceDatabaseName && targetDatabaseName && sourceDatabaseName !== targetDatabaseName) {
    args.push(`--nsInclude=${sourceDatabaseName}.*`, `--nsFrom=${sourceDatabaseName}.*`, `--nsTo=${targetDatabaseName}.*`)
  }

  run("mongorestore", args)
}

function backupRemoteTarget(options, targetEnvironment) {
  ensureRemoteConfiguration(options)
  const remoteEnvPath = `.smartsite-self-hosted/generated/${targetEnvironment}.env`
  const remoteCommand = `cd ${shellEscape(options.sshPath)} && ./docker/backup-self-hosted.sh ${shellEscape(remoteEnvPath)}`
  run("ssh", [`${options.sshUser}@${options.sshHost}`, remoteCommand])
}

function restoreRemoteArchive(options, targetEnvironment, remoteArchivePath, force) {
  ensureRemoteConfiguration(options)
  const remoteEnvPath = `.smartsite-self-hosted/generated/${targetEnvironment}.env`
  const restoreCommand = [
    `cd ${shellEscape(options.sshPath)}`,
    `./docker/restore-mongo-archive.sh --env=${shellEscape(remoteEnvPath)} ${shellEscape(remoteArchivePath)} --yes${force ? " --force" : ""}`,
  ].join(" && ")

  run("ssh", [`${options.sshUser}@${options.sshHost}`, restoreCommand])
}

function main() {
  const options = readArgs(process.argv.slice(2))
  ensureUsage(options)

  const projectDir = process.cwd()

  if (options.source === "preview" || options.target === "preview") {
    const manifest = materializeSelfHostedEnv(options.config, options.sourceOverride)
    const hasPreview = manifest.outputs.some(output => output.name === "preview")

    if (!hasPreview) {
      throw new Error(`Preview is not enabled in ${options.config}.`)
    }
  }

  const localArchivePath = resolveArchivePath(projectDir, options.archive, options.source, options.target)
  const remoteArchivePath = fetchRemoteArchive(options, options.source, localArchivePath)

  if (options.target === "local") {
    const localEnvPath = resolveLocalEnvPath(projectDir, options.localEnv)
    const backupPath = backupLocalTarget(projectDir, localEnvPath, "data-pull", options.force)

    if (backupPath) {
      console.log(`Local safety backup: ${path.relative(projectDir, backupPath)}`)
    }

    restoreLocalArchive(localEnvPath, localArchivePath)
    console.log(`Pulled ${options.source} data into local using ${path.relative(projectDir, localArchivePath)}`)
    return
  }

  backupRemoteTarget(options, options.target)
  restoreRemoteArchive(options, options.target, remoteArchivePath, options.force)
  console.log(`Pulled ${options.source} data into ${options.target} on ${options.sshHost}`)
}

main()
