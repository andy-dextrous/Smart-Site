import fs from "fs"
import path from "path"
import { spawnSync } from "child_process"

const DEFAULT_CONFIG_PATH = "smartsite-deployment.json"
const GENERATED_ROOT = ".smartsite-self-hosted/generated"

/*************************************************************************/
/*  ARGUMENTS
/*************************************************************************/

function readArgs(argv) {
  const args = {
    config: DEFAULT_CONFIG_PATH,
    source: "",
  }

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index]
    const next = argv[index + 1]

    if (current === "--config" && next) {
      args.config = next
      index += 1
      continue
    }

    if (current === "--source" && next) {
      args.source = next
      index += 1
    }
  }

  return args
}

/*************************************************************************/
/*  CONFIGURATION
/*************************************************************************/

function ensureObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`)
  }

  return value
}

function loadDeploymentConfig(configPath) {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Deployment config not found: ${configPath}`)
  }

  const raw = fs.readFileSync(configPath, "utf8")
  const parsed = JSON.parse(raw)
  const environments = ensureObject(parsed.environments, "Deployment environments")
  const production = ensureObject(environments.production, "Deployment environments.production")
  const preview = environments.preview ? ensureObject(environments.preview, "Deployment environments.preview") : null

  if (parsed.profile !== "self-hosted-mongo") {
    throw new Error(`Unsupported deployment profile: ${parsed.profile}`)
  }

  if (!production.enabled) {
    throw new Error("Production environment must be enabled")
  }

  if (!production.url) {
    throw new Error("Production environment must define a public url")
  }

  return {
    ...parsed,
    sourceEnv: parsed.sourceEnv || ".env",
    environments: {
      production,
      preview,
    },
  }
}

/*************************************************************************/
/*  TARGET DERIVATION
/*************************************************************************/

function ensureDirectory(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true })
}

function resolveOutputPath(name) {
  return path.join(GENERATED_ROOT, `${name}.env`)
}

function defaultBackupDir(name) {
  return path.join(".smartsite-self-hosted", "backups", name)
}

function ensureSecurePreviewUrl(name, target) {
  if (name !== "preview") {
    return
  }

  if (!target.enabled) {
    return
  }

  let url

  try {
    url = new URL(target.url)
  } catch {
    throw new Error("Preview environment must define a valid URL")
  }

  if (url.protocol !== "https:") {
    throw new Error("Preview environment must use HTTPS")
  }
}

function buildTargetArgs(name, target, sourceEnv) {
  ensureSecurePreviewUrl(name, target)

  const outputPath = resolveOutputPath(name)
  const args = [
    "scripts/generate-self-hosted-env.mjs",
    "--source",
    sourceEnv,
    "--output",
    outputPath,
    "--public-url",
    target.url,
    "--runtime-env",
    name,
    "--allow-indexing",
    String(target.allowIndexing ?? (name === "production")),
    "--stack-name",
    target.stackName || (name === "production" ? "smartsite-self-hosted" : `smartsite-self-hosted-${name}`),
    "--host-port",
    String(target.hostPort || (name === "production" ? 80 : 8080)),
    "--https-port",
    String(target.httpsPort || (name === "production" ? 443 : 8443)),
  ]

  if (target.caddySiteAddress) {
    args.push("--caddy-site-address", String(target.caddySiteAddress))
  }

  if (target.backupDir) {
    args.push("--backup-dir", String(target.backupDir))
  } else {
    args.push("--backup-dir", defaultBackupDir(name))
  }

  if (target.backupRetention) {
    args.push("--backup-retention", String(target.backupRetention))
  }

  if (target.backupCronSchedule) {
    args.push("--backup-cron-schedule", String(target.backupCronSchedule))
  }

  return { outputPath, args }
}

/*************************************************************************/
/*  EXECUTION
/*************************************************************************/

function runNodeScript(cwd, args) {
  const result = spawnSync(process.execPath, args, {
    cwd,
    stdio: "inherit",
  })

  if (result.status !== 0) {
    throw new Error(`Command failed: node ${args.join(" ")}`)
  }
}

export function materializeSelfHostedEnv(configPath, sourceOverride = "") {
  const absoluteConfigPath = path.resolve(process.cwd(), configPath)
  const config = loadDeploymentConfig(absoluteConfigPath)
  const projectDir = path.dirname(absoluteConfigPath)
  const sourceEnv = sourceOverride || config.sourceEnv
  const outputs = []

  ensureDirectory(path.join(projectDir, GENERATED_ROOT))

  const targets = [["production", config.environments.production]]

  if (config.environments.preview?.enabled) {
    targets.push(["preview", config.environments.preview])
  }

  for (const [name, target] of targets) {
    const { outputPath, args } = buildTargetArgs(name, target, sourceEnv)
    runNodeScript(projectDir, args)
    outputs.push({
      name,
      outputPath,
      url: target.url,
    })
  }

  return {
    profile: config.profile,
    provider: config.provider,
    configPath: absoluteConfigPath,
    outputs,
  }
}

/*************************************************************************/
/*  CLI ENTRYPOINT
/*************************************************************************/

function main() {
  const options = readArgs(process.argv.slice(2))
  const result = materializeSelfHostedEnv(options.config, options.source)

  console.log("")
  console.log(`Prepared ${result.outputs.length} self-hosted environment file(s).`)

  for (const output of result.outputs) {
    console.log(`- ${output.name}: ${output.outputPath} -> ${output.url}`)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
