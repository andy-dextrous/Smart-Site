import crypto from "crypto"
import fs from "fs"
import path from "path"

function readArgs(argv) {
  const args = {
    source: ".env",
    output: ".smartsite-self-hosted/generated/production.env",
    publicUrl: "http://localhost:3000",
    runtimeEnv: "production",
    allowIndexing: "true",
    stackName: "",
    hostPort: "3000",
    httpsPort: "443",
    caddySiteAddress: "",
    dbHost: "mongo",
    dbPort: "27017",
    backupDir: ".smartsite-self-hosted/backups/production",
    backupRetention: "7",
    backupCronSchedule: "30 2 * * *",
    deploymentId: "",
  }

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index]
    const next = argv[index + 1]

    if (current === "--source" && next) {
      args.source = next
      index += 1
      continue
    }

    if (current === "--output" && next) {
      args.output = next
      index += 1
      continue
    }

    if (current === "--public-url" && next) {
      args.publicUrl = next
      index += 1
      continue
    }

    if (current === "--runtime-env" && next) {
      args.runtimeEnv = next
      index += 1
      continue
    }

    if (current === "--allow-indexing" && next) {
      args.allowIndexing = next
      index += 1
      continue
    }

    if (current === "--stack-name" && next) {
      args.stackName = next
      index += 1
      continue
    }

    if (current === "--host-port" && next) {
      args.hostPort = next
      index += 1
      continue
    }

    if (current === "--https-port" && next) {
      args.httpsPort = next
      index += 1
      continue
    }

    if (current === "--caddy-site-address" && next) {
      args.caddySiteAddress = next
      index += 1
      continue
    }

    if (current === "--db-host" && next) {
      args.dbHost = next
      index += 1
      continue
    }

    if (current === "--db-port" && next) {
      args.dbPort = next
      index += 1
      continue
    }

    if (current === "--backup-dir" && next) {
      args.backupDir = next
      index += 1
      continue
    }

    if (current === "--backup-retention" && next) {
      args.backupRetention = next
      index += 1
      continue
    }

    if (current === "--backup-cron-schedule" && next) {
      args.backupCronSchedule = next
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
    const value = line
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^"(.*)"$/, "$1")
      .replace(/\s+#.*$/, "")
    values[key] = value
  }

  return values
}

function randomSecret(length = 24) {
  return crypto.randomBytes(length).toString("hex")
}

function randomBase64(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64")
}

function randomDeploymentId() {
  return `deploy-${new Date().toISOString().replace(/[-:.TZ]/g, "")}-${crypto
    .randomBytes(4)
    .toString("hex")}`
}

function resolveRuntimeEnvironment(value) {
  if (!value) {
    return "production"
  }

  return value.toLowerCase()
}

function defaultStackName(runtimeEnv) {
  if (runtimeEnv === "production") {
    return "smartsite-self-hosted"
  }

  return `smartsite-self-hosted-${runtimeEnv}`
}

function deriveCaddySiteAddress(publicUrl) {
  try {
    const url = new URL(publicUrl)

    if (["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname)) {
      return ":80"
    }

    return url.port ? `${url.hostname}:${url.port}` : url.hostname
  } catch {
    return ":80"
  }
}

function isLocalUrl(value) {
  if (!value) {
    return false
  }

  try {
    const url = new URL(value)
    return ["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname)
  } catch {
    return false
  }
}

function resolveDatabaseName(databaseUrl) {
  if (!databaseUrl) {
    return "smart-site-starter"
  }

  try {
    const url = new URL(databaseUrl)
    return url.pathname.replace(/^\//, "") || "smart-site-starter"
  } catch {
    return "smart-site-starter"
  }
}

function buildEnv(sourceValues, existingValues, options) {
  const runtimeEnv = resolveRuntimeEnvironment(
    options.runtimeEnv ||
      existingValues.SMARTSITE_RUNTIME_ENV ||
      sourceValues.SMARTSITE_RUNTIME_ENV
  )
  const databaseName = resolveDatabaseName(sourceValues.DATABASE_URL)
  const rootUsername = existingValues.MONGO_INITDB_ROOT_USERNAME || "smartsite_root"
  const rootPassword = existingValues.MONGO_INITDB_ROOT_PASSWORD || randomSecret()
  const appUsername = existingValues.MONGO_APP_USERNAME || "smartsite_app"
  const appPassword = existingValues.MONGO_APP_PASSWORD || randomSecret()
  const nextPublicUrl =
    options.publicUrl || sourceValues.NEXT_PUBLIC_URL || "http://localhost:3000"
  const stackName =
    options.stackName ||
    existingValues.SMARTSITE_STACK_NAME ||
    sourceValues.SMARTSITE_STACK_NAME ||
    defaultStackName(runtimeEnv)
  const caddySiteAddress =
    options.caddySiteAddress ||
    existingValues.CADDY_SITE_ADDRESS ||
    sourceValues.CADDY_SITE_ADDRESS ||
    deriveCaddySiteAddress(nextPublicUrl)
  const imageName =
    existingValues.SMARTSITE_IMAGE_NAME ||
    sourceValues.SMARTSITE_IMAGE_NAME ||
    `${stackName}-app`

  const values = {
    ...sourceValues,
    NODE_ENV: "production",
    SMARTSITE_DEPLOYMENT_PROFILE: "self-hosted-mongo",
    SMARTSITE_RUNTIME_ENV: runtimeEnv,
    SMARTSITE_ALLOW_INDEXING:
      options.allowIndexing ||
      existingValues.SMARTSITE_ALLOW_INDEXING ||
      sourceValues.SMARTSITE_ALLOW_INDEXING ||
      "true",
    SMARTSITE_STACK_NAME: stackName,
    SMARTSITE_IMAGE_NAME: imageName,
    NEXT_PUBLIC_URL: nextPublicUrl,
    NEXT_PUBLIC_SITE_URL: nextPublicUrl,
    NEXT_PUBLIC_PRODUCTION_URL: nextPublicUrl,
    HOST_PORT: options.hostPort || sourceValues.HOST_PORT || "3000",
    HTTPS_PORT: options.httpsPort || sourceValues.HTTPS_PORT || "443",
    CADDY_SITE_ADDRESS: caddySiteAddress,
    DATABASE_PROVIDER: "mongoose",
    DATABASE_URL: `mongodb://${appUsername}:${appPassword}@${options.dbHost}:${options.dbPort}/${databaseName}?authSource=${databaseName}&replicaSet=smartsite-rs`,
    MONGO_INITDB_DATABASE: databaseName,
    MONGO_INITDB_ROOT_USERNAME: rootUsername,
    MONGO_INITDB_ROOT_PASSWORD: rootPassword,
    MONGO_APP_USERNAME: appUsername,
    MONGO_APP_PASSWORD: appPassword,
    MONGO_REPLICA_KEY: existingValues.MONGO_REPLICA_KEY || randomBase64(48),
    SMARTSITE_SITE_ID: existingValues.SMARTSITE_SITE_ID || crypto.randomUUID(),
    SMARTSITE_ENVIRONMENT: runtimeEnv === "production" ? "production" : "preview",
    PAYLOAD_SECRET: existingValues.PAYLOAD_SECRET || randomSecret(32),
    CRON_SECRET: existingValues.CRON_SECRET || randomSecret(32),
    SMARTSITE_BACKGROUND_RECOVERY:
      existingValues.SMARTSITE_BACKGROUND_RECOVERY || sourceValues.SMARTSITE_BACKGROUND_RECOVERY || "false",
    PREVIEW_SECRET: existingValues.PREVIEW_SECRET || randomSecret(16),
    NEXT_SERVER_ACTIONS_ENCRYPTION_KEY:
      existingValues.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY || randomBase64(32),
    NEXT_DEPLOYMENT_ID:
      options.deploymentId ||
      existingValues.NEXT_DEPLOYMENT_ID ||
      sourceValues.NEXT_DEPLOYMENT_ID ||
      randomDeploymentId(),
    SMARTSITE_BACKUP_DIR:
      options.backupDir ||
      existingValues.SMARTSITE_BACKUP_DIR ||
      sourceValues.SMARTSITE_BACKUP_DIR ||
      `.smartsite-self-hosted/backups/${runtimeEnv}`,
    SMARTSITE_BACKUP_RETENTION:
      options.backupRetention ||
      existingValues.SMARTSITE_BACKUP_RETENTION ||
      sourceValues.SMARTSITE_BACKUP_RETENTION ||
      "7",
    SMARTSITE_BACKUP_CRON_SCHEDULE:
      options.backupCronSchedule ||
      existingValues.SMARTSITE_BACKUP_CRON_SCHEDULE ||
      sourceValues.SMARTSITE_BACKUP_CRON_SCHEDULE ||
      "30 2 * * *",
    PAYLOAD_CONFIG_PATH: "./src/payload.config.ts",
  }

  // Local identity, production credentials and model-provider keys must not leak
  // into a new destination. Existing destination secrets remain stable on reruns.
  for (const key of Object.keys(values))
    if (
      key.startsWith("SMARTSITE_AI_") ||
      key.startsWith("AI_AGENT_") ||
      key === "STAGING_DATABASE_URL" ||
      key === "SMARTSITE_DATABASE_TARGET"
    )
      delete values[key]

  return values
}

function serializeEnv(values) {
  const orderedKeys = [
    "NODE_ENV",
    "SMARTSITE_DEPLOYMENT_PROFILE",
    "SMARTSITE_RUNTIME_ENV",
    "SMARTSITE_ALLOW_INDEXING",
    "SMARTSITE_STACK_NAME",
    "SMARTSITE_IMAGE_NAME",
    "NEXT_PUBLIC_URL",
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_PRODUCTION_URL",
    "NEXT_DEPLOYMENT_ID",
    "HOST_PORT",
    "HTTPS_PORT",
    "CADDY_SITE_ADDRESS",
    "PAYLOAD_CONFIG_PATH",
    "DATABASE_PROVIDER",
    "DATABASE_URL",
    "MONGO_INITDB_DATABASE",
    "MONGO_INITDB_ROOT_USERNAME",
    "MONGO_INITDB_ROOT_PASSWORD",
    "MONGO_APP_USERNAME",
    "MONGO_APP_PASSWORD",
    "PAYLOAD_SECRET",
    "CRON_SECRET",
    "PREVIEW_SECRET",
    "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY",
    "SMARTSITE_BACKUP_DIR",
    "SMARTSITE_BACKUP_RETENTION",
    "SMARTSITE_BACKUP_CRON_SCHEDULE",
  ]

  const remainingKeys = Object.keys(values)
    .filter(key => !orderedKeys.includes(key))
    .sort()

  const keys = [...orderedKeys, ...remainingKeys]
  const lines = []

  for (const key of keys) {
    const value = values[key]

    if (typeof value === "undefined") {
      continue
    }

    lines.push(`${key}=${value}`)
  }

  return `${lines.join("\n")}\n`
}

function main() {
  const options = readArgs(process.argv.slice(2))
  const sourcePath = path.resolve(process.cwd(), options.source)
  const outputPath = path.resolve(process.cwd(), options.output)

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source env file not found: ${sourcePath}`)
  }

  const sourceContent = fs.readFileSync(sourcePath, "utf8")
  const sourceValues = parseEnv(sourceContent)
  const existingValues = fs.existsSync(outputPath)
    ? parseEnv(fs.readFileSync(outputPath, "utf8"))
    : {}
  const outputValues = buildEnv(sourceValues, existingValues, options)
  const serialized = serializeEnv(outputValues)

  fs.writeFileSync(outputPath, serialized)

  console.log(`Wrote ${path.relative(process.cwd(), outputPath)}`)
  console.log(`Database: ${outputValues.MONGO_INITDB_DATABASE}`)
  console.log(`Public URL: ${outputValues.NEXT_PUBLIC_URL}`)
}

main()
