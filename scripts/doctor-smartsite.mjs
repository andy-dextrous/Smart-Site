import {
  detectHostingMode,
  fileExists,
  getProjectPaths,
  inferDatabaseTarget,
  parseEnv,
  readAiEnabled,
  readText,
  summarizeEnvHealth,
} from "./smartsite-local-tools.mjs"

/*************************************************************************/
/*  SMARTSITE DOCTOR
/*************************************************************************/

function describeStatus(ok) {
  return ok ? "ok" : "needs attention"
}

function main() {
  const paths = getProjectPaths(process.cwd())
  const mode = detectHostingMode(paths)
  const envExists = fileExists(paths.envPath)
  const env = envExists ? parseEnv(readText(paths.envPath)) : {}
  const generatedProductionEnv =
    mode.hasGeneratedProductionEnv ? parseEnv(readText(paths.generatedProductionEnvPath)) : {}
  const health = summarizeEnvHealth(env)
  const aiEnabled = readAiEnabled(readText(paths.configPath))
  const databaseTarget =
    mode.mode === "self-hosted"
      ? inferDatabaseTarget(generatedProductionEnv.DATABASE_URL || env.DATABASE_URL)
      : inferDatabaseTarget(env.DATABASE_URL)

  const blockers = []

  if (!envExists) {
    blockers.push("Missing .env")
  }

  if (envExists && !health.hasDatabaseUrl) {
    blockers.push("DATABASE_URL is missing or still using the placeholder value")
  }

  if (envExists && !health.hasPayloadSecret) {
    blockers.push("PAYLOAD_SECRET is missing")
  }

  if (envExists && !health.hasPreviewSecret) {
    blockers.push("PREVIEW_SECRET is missing")
  }

  if (envExists && !health.hasPublicUrl) {
    blockers.push("NEXT_PUBLIC_URL is missing")
  }

  console.log("SmartSite doctor")
  console.log("")
  console.log(`- hosting mode: ${mode.mode}`)
  console.log(`- smartsite-deployment.json: ${mode.hasManifest ? "present" : "absent"}`)
  console.log(`- self-hosted generated production env: ${mode.hasGeneratedProductionEnv ? "present" : "absent"}`)
  console.log(`- .env: ${envExists ? "present" : "absent"}`)
  console.log(`- database target: ${databaseTarget}`)
  console.log(`- AI: ${aiEnabled ? "enabled" : "disabled"}`)
  console.log(`- DATABASE_URL: ${describeStatus(health.hasDatabaseUrl)}`)
  console.log(`- PAYLOAD_SECRET: ${describeStatus(health.hasPayloadSecret)}`)
  console.log(`- PREVIEW_SECRET: ${describeStatus(health.hasPreviewSecret)}`)
  console.log(`- NEXT_PUBLIC_URL: ${describeStatus(health.hasPublicUrl)}`)

  if (aiEnabled) {
    console.log(`- AI_AGENT_API_KEY: ${describeStatus(health.hasAiApiKey)}`)
  }

  console.log("")

  if (blockers.length > 0) {
    console.log("Blockers:")

    for (const blocker of blockers) {
      console.log(`- ${blocker}`)
    }
  } else {
    console.log("No bootstrap blockers detected.")
  }

  console.log("")
  console.log("Recommended next step:")

  if (!envExists) {
    console.log("- `pnpm bootstrap`")
  } else if (mode.mode === "self-hosted" && !mode.hasGeneratedProductionEnv) {
    console.log("- `pnpm self-hosted:prepare`")
  } else if (mode.mode === "self-hosted") {
    console.log("- `pnpm self-hosted:run -- guard`")
  } else {
    console.log("- `pnpm dev`")
  }

  if (blockers.length > 0) {
    process.exitCode = 1
  }
}

main()
