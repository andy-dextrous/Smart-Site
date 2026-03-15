import { spawnSync } from "child_process"
import { describeGitWarnings, inspectGitState } from "./inspect-git-state.mjs"
import { materializeSelfHostedEnv } from "./materialize-self-hosted-env.mjs"

/*************************************************************************/
/*  ARGUMENTS
/*************************************************************************/

function readArgs(argv) {
  const normalized = argv[0] === "--" ? argv.slice(1) : argv
  const [action = "", ...rest] = normalized

  const args = {
    action,
    positionals: [],
    config: "smartsite-deployment.json",
    source: "",
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

    if (current === "--source" && next) {
      args.source = next
      index += 1
      continue
    }

    if (current === "--force") {
      args.force = true
      args.positionals.push(current)
      continue
    }

    args.positionals.push(current)
  }

  return args
}

/*************************************************************************/
/*  ACTION RESOLUTION
/*************************************************************************/

function resolveScript(action) {
  switch (action) {
    case "deploy":
      return "./docker/deploy-self-hosted.sh"
    case "backup":
      return "./docker/backup-self-hosted.sh"
    case "history":
      return "./docker/history-self-hosted.sh"
    case "probe":
      return "./docker/probe-self-hosted.sh"
    case "rollback":
      return "./docker/rollback-self-hosted.sh"
    case "status":
      return "./docker/status-self-hosted.sh"
    case "install-backup-cron":
      return "./docker/install-backup-cron.sh"
    default:
      throw new Error(`Unsupported self-hosted action: ${action}`)
  }
}

function resolveEnvironment(action, positionals) {
  switch (action) {
    case "deploy":
    case "backup":
    case "history":
    case "probe":
    case "status":
    case "install-backup-cron":
      return positionals[0] || "production"
    case "rollback":
      return positionals[0] && ["production", "preview"].includes(positionals[0]) ? positionals[0] : "production"
    case "restore":
      return positionals[0] && ["production", "preview"].includes(positionals[0]) ? positionals[0] : "production"
    case "promote":
      return "production"
    case "preview":
      return "preview"
    case "guard":
      return positionals[0] && ["production", "preview"].includes(positionals[0]) ? positionals[0] : "production"
    default:
      return ""
  }
}

function resolvePassthrough(action, positionals) {
  if (action === "restore") {
    if (positionals[0] && ["production", "preview"].includes(positionals[0])) {
      return positionals.slice(1)
    }

    return positionals
  }

  if (action === "rollback") {
    if (positionals[0] && ["production", "preview"].includes(positionals[0])) {
      return positionals.slice(1)
    }

    return positionals
  }

  if (["deploy", "backup", "history", "status", "install-backup-cron"].includes(action)) {
    return positionals.slice(positionals[0] ? 1 : 0)
  }

  if (action === "guard") {
    return positionals.slice(positionals[0] ? 1 : 0)
  }

  return []
}

function normalizeAction(action) {
  switch (action) {
    case "promote":
    case "preview":
      return "deploy"
    default:
      return action
  }
}

function ensureUsage(action, passthrough) {
  if (!action) {
    throw new Error(
      "Usage: node scripts/run-self-hosted-action.mjs <prepare|deploy|promote|preview|backup|history|probe|restore|rollback|status|install-backup-cron|guard> [environment] [extra args] [--config smartsite-deployment.json] [--force]",
    )
  }

  if (action === "restore" && !passthrough[0]) {
    throw new Error(
      "Usage: node scripts/run-self-hosted-action.mjs restore [production|preview] <archive-path> [--yes] [--force] [--config smartsite-deployment.json]",
    )
  }

  if (action === "rollback" && passthrough[1]) {
    throw new Error(
      "Usage: node scripts/run-self-hosted-action.mjs rollback [production|preview] [deployment-id] [--config smartsite-deployment.json] [--force]",
    )
  }
}

/*************************************************************************/
/*  GUARDS
/*************************************************************************/

function shouldGuardGit(action) {
  return ["deploy", "promote", "preview", "rollback", "restore", "guard"].includes(action)
}

function runGitGuard(action, environment, force) {
  if (!shouldGuardGit(action)) {
    return
  }

  const gitState = inspectGitState(process.cwd())
  const warnings = describeGitWarnings(gitState)

  if (!gitState.isRepository) {
    return
  }

  if (action === "guard") {
    if (warnings.length === 0) {
      console.log("Git guard: clean")
      return
    }

    console.log("Git guard warnings:")

    for (const warning of warnings) {
      console.log(`- ${warning}`)
    }

    return
  }

  if (gitState.dirty && !force) {
    throw new Error(`Refusing to ${action} with uncommitted changes. Commit or stash them first, or re-run with --force.`)
  }

  if ((action === "promote" || (action === "deploy" && environment === "production") || (action === "rollback" && environment === "production")) && gitState.behind > 0 && !force) {
    throw new Error(
      `Refusing to ${action} production while the current branch is behind upstream by ${gitState.behind} commit(s). Rebase or pull first, or re-run with --force.`,
    )
  }

  if (warnings.length > 0) {
    console.log("Git guard warnings:")

    for (const warning of warnings) {
      console.log(`- ${warning}`)
    }
  }
}

/*************************************************************************/
/*  EXECUTION
/*************************************************************************/

function main() {
  const options = readArgs(process.argv.slice(2))
  const environment = resolveEnvironment(options.action, options.positionals)
  const passthrough = resolvePassthrough(options.action, options.positionals)
  const action = normalizeAction(options.action)

  ensureUsage(options.action, passthrough)
  runGitGuard(options.action, environment, options.force)

  const manifest = materializeSelfHostedEnv(options.config, options.source)

  if (options.action === "prepare") {
    return
  }

  const target = manifest.outputs.find(entry => entry.name === environment)

  if (!target) {
    throw new Error(`Environment '${environment}' is not enabled in ${options.config}. Enable it in the deployment manifest before running this action.`)
  }

  if (options.action === "guard") {
    console.log(`Guard target: ${environment}`)
    console.log(`Guard URL: ${target.url}`)
    console.log(`Guard env file: ${target.outputPath}`)
    return
  }

  const script = resolveScript(action)
  const scriptArgs =
    options.action === "restore"
      ? [`--env=${target.outputPath}`, ...passthrough]
      : [target.outputPath, ...passthrough]
  const result = spawnSync(script, scriptArgs, {
    stdio: "inherit",
  })

  if (result.status !== 0) {
    throw new Error(`Self-hosted action failed: ${options.action} ${environment}`)
  }
}

main()
