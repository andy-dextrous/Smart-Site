import fs from "fs"
import path from "path"
import { spawnSync } from "child_process"
import dotenv from "dotenv"
import { materializeSelfHostedEnv } from "./materialize-self-hosted-env.mjs"
import { describeGitWarnings, inspectGitState } from "./inspect-git-state.mjs"

const VALID_ENVIRONMENTS = new Set(["local", "production", "preview"])

function readArgs(argv) {
  const normalized = argv[0] === "--" ? argv.slice(1) : argv
  const separatorIndex = normalized.indexOf("--")
  const base = separatorIndex === -1 ? normalized : normalized.slice(0, separatorIndex)
  const passthrough = separatorIndex === -1 ? [] : normalized.slice(separatorIndex + 1)
  const [environment = "", migrationScript = "", ...rest] = base

  const args = {
    environment,
    migrationScript,
    passthrough,
    config: "smartsite-deployment.json",
    localEnv: ".env",
    sourceOverride: "",
    sshHost: process.env.SELF_HOSTED_HOST || "",
    sshUser: process.env.SELF_HOSTED_USER || "root",
    sshPath: process.env.SELF_HOSTED_PATH || "/opt/smartsite-self-hosted",
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
  if (!VALID_ENVIRONMENTS.has(options.environment) || !options.migrationScript) {
    throw new Error(
      "Usage: node scripts/run-self-hosted-migrate.mjs <local|production|preview> <scripts/migrations/*.ts> [--config smartsite-deployment.json] [--local-env .env] [--ssh-host host] [--ssh-user user] [--ssh-path /opt/smartsite-self-hosted] [--yes] [--force] [-- <script args>]",
    )
  }

  if (!options.yes) {
    throw new Error("Refusing to run a migration without confirmation. Re-run with --yes.")
  }
}

function ensureRemoteConfiguration(options) {
  if (!options.sshHost) {
    throw new Error("Missing self-hosted runtime host. Set SELF_HOSTED_HOST or pass --ssh-host.")
  }
}

function ensureMigrationPath(projectDir, migrationScript, force) {
  const absolutePath = path.resolve(projectDir, migrationScript)

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Migration script not found: ${absolutePath}`)
  }

  const relativePath = path.relative(projectDir, absolutePath).replace(/\\/g, "/")

  if (!relativePath.startsWith("scripts/migrations/") && !force) {
    throw new Error("Only scripts under scripts/migrations/ are allowed by default. Re-run with --force if you intentionally need another path.")
  }

  return relativePath
}

function runGitGuard(environment, force) {
  const gitState = inspectGitState(process.cwd())
  const warnings = describeGitWarnings(gitState)

  if (!gitState.isRepository) {
    return
  }

  if (gitState.dirty && !force) {
    throw new Error("Refusing to run a migration with uncommitted changes. Commit or stash them first, or re-run with --force.")
  }

  if (environment === "production" && gitState.behind > 0 && !force) {
    throw new Error(
      `Refusing to migrate production while the current branch is behind upstream by ${gitState.behind} commit(s). Rebase or pull first, or re-run with --force.`,
    )
  }

  if (warnings.length > 0) {
    console.log("Git guard warnings:")

    for (const warning of warnings) {
      console.log(`- ${warning}`)
    }
  }
}

function resolveLocalEnvPath(projectDir, localEnv) {
  const envPath = path.resolve(projectDir, localEnv)

  if (!fs.existsSync(envPath)) {
    throw new Error(`Local env file not found: ${envPath}`)
  }

  return envPath
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

    throw new Error(`Failed to create local safety backup before migration.\n${error.message}`)
  }
}

function runLocalMigration(projectDir, envPath, migrationScript, passthrough) {
  const envValues = dotenv.parse(fs.readFileSync(envPath, "utf8"))
  const childEnv = {
    ...process.env,
    ...envValues,
    PAYLOAD_CONFIG_PATH: process.env.PAYLOAD_CONFIG_PATH || path.join(projectDir, "src", "admin", "payload", "payload.config.ts"),
  }

  run("pnpm", ["exec", "tsx", migrationScript, ...passthrough], {
    cwd: projectDir,
    env: childEnv,
  })
}

function runRemoteMigration(options, environment, migrationScript, passthrough) {
  ensureRemoteConfiguration(options)
  const remoteEnvPath = `.smartsite-self-hosted/generated/${environment}.env`
  const escapedArgs = passthrough.map(shellEscape).join(" ")
  const migrationCommand = [
    `cd ${shellEscape(options.sshPath)}`,
    `./docker/backup-self-hosted.sh ${shellEscape(remoteEnvPath)}`,
    `SMARTSITE_ENV_FILE=${shellEscape(remoteEnvPath)} docker compose --project-directory ${shellEscape(options.sshPath)} --env-file ${shellEscape(remoteEnvPath)} up -d mongo`,
    `SMARTSITE_ENV_FILE=${shellEscape(remoteEnvPath)} docker compose --project-directory ${shellEscape(options.sshPath)} --env-file ${shellEscape(remoteEnvPath)} run --rm app pnpm exec tsx ${shellEscape(migrationScript)}${escapedArgs ? ` ${escapedArgs}` : ""}`,
  ].join(" && ")

  run("ssh", [`${options.sshUser}@${options.sshHost}`, migrationCommand])
}

function main() {
  const options = readArgs(process.argv.slice(2))
  ensureUsage(options)
  runGitGuard(options.environment, options.force)

  const projectDir = process.cwd()
  const migrationScript = ensureMigrationPath(projectDir, options.migrationScript, options.force)

  if (options.environment === "preview") {
    const manifest = materializeSelfHostedEnv(options.config, options.sourceOverride)
    const hasPreview = manifest.outputs.some(output => output.name === "preview")

    if (!hasPreview) {
      throw new Error(`Preview is not enabled in ${options.config}.`)
    }
  }

  if (options.environment === "local") {
    const localEnvPath = resolveLocalEnvPath(projectDir, options.localEnv)
    const backupPath = backupLocalTarget(projectDir, localEnvPath, "migration", options.force)

    if (backupPath) {
      console.log(`Local safety backup: ${path.relative(projectDir, backupPath)}`)
    }

    runLocalMigration(projectDir, localEnvPath, migrationScript, options.passthrough)
    return
  }

  runRemoteMigration(options, options.environment, migrationScript, options.passthrough)
}

main()
