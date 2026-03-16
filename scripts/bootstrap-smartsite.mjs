import {
  copyEnvExampleIfMissing,
  deriveBootstrapEnvUpdates,
  getProjectPaths,
  hasPlaceholderDatabaseUrl,
  inferDatabaseTarget,
  parseEnv,
  readAiEnabled,
  readSiteName,
  readText,
  setAiEnabled,
  setSiteName,
  summarizeEnvHealth,
  upsertEnvValues,
  writeText,
} from "./smartsite-local-tools.mjs"
import { runLocalSeedWorkflow } from "./seed-smartsite.mjs"
import readline from "node:readline/promises"
import process from "node:process"

/*************************************************************************/
/*  SMARTSITE BOOTSTRAP
/*************************************************************************/

const LOCAL_DATABASE_URL = "mongodb://127.0.0.1:27017/smart-site-dev"
const DEFAULT_PUBLIC_URL = "http://localhost:3000"

async function askText(rl, prompt, defaultValue = "") {
  const suffix = defaultValue ? ` [${defaultValue}]` : ""
  const answer = (await rl.question(`${prompt}${suffix}: `)).trim()

  return answer || defaultValue
}

async function askYesNo(rl, prompt, defaultValue = false) {
  const suffix = defaultValue ? " [Y/n]" : " [y/N]"
  const answer = (await rl.question(`${prompt}${suffix}: `)).trim().toLowerCase()

  if (!answer) {
    return defaultValue
  }

  return answer === "y" || answer === "yes"
}

async function askPassword(rl, prompt, defaultValue = "") {
  const suffix = defaultValue ? " [stored]" : ""
  const answer = (await rl.question(`${prompt}${suffix}: `, { hideEchoBack: true })).trim()

  return answer || defaultValue
}

function isValidEmail(value) {
  return /.+@.+\..+/.test(value)
}

async function askDatabaseChoice(rl, currentEnv) {
  const currentTarget = inferDatabaseTarget(currentEnv.DATABASE_URL)
  const currentLabel =
    hasPlaceholderDatabaseUrl(currentEnv.DATABASE_URL)
      ? "local"
      : currentTarget === "managed-mongo"
      ? "atlas"
      : currentTarget === "local-mongo"
        ? "local"
        : currentTarget === "mongo"
          ? "mongo"
          : "local"

  while (true) {
    const answer = (
      await rl.question(
        `Database for development? [local/atlas] [${currentLabel}]: `,
      )
    )
      .trim()
      .toLowerCase()

    const value = answer || currentLabel

    if (value === "local") {
      return {
        DATABASE_PROVIDER: "mongoose",
        DATABASE_URL: LOCAL_DATABASE_URL,
      }
    }

    if (value === "atlas") {
      const atlasUrl = await askText(
        rl,
        "Paste the MongoDB Atlas connection string",
        currentTarget === "managed-mongo" ? currentEnv.DATABASE_URL || "" : "",
      )

      if (atlasUrl) {
        return {
          DATABASE_PROVIDER: "mongoose",
          DATABASE_URL: atlasUrl,
        }
      }

      console.log("Atlas was selected but no connection string was provided.")
      continue
    }

    console.log("Please answer `local` or `atlas`.")
  }
}

async function collectInteractiveChoices(currentEnv, aiEnabled) {
  const currentConfigText = readText(getProjectPaths(process.cwd()).configPath)
  const currentSiteName = readSiteName(currentConfigText) || "Smart Site"
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  try {
    console.log("SmartSite bootstrap")
    console.log("")
    console.log("This sets up local development only.")
    console.log("It will not seed the database or enable AI unless you explicitly ask.")
    console.log("")

    const siteName = await askText(rl, "Site name", currentSiteName)
    const databaseUpdates = await askDatabaseChoice(rl, currentEnv)
    const publicUrl = await askText(
      rl,
      "Local app URL",
      currentEnv.NEXT_PUBLIC_URL || DEFAULT_PUBLIC_URL,
    )
    const generateSecrets = await askYesNo(rl, "Generate missing secrets now?", true)
    const enableAiNow = aiEnabled ? false : await askYesNo(rl, "Enable AI now?", false)
    const adminName = await askText(rl, "Admin first name", currentEnv.PAYLOAD_ADMIN_NAME || "Admin")
    let adminEmail = await askText(
      rl,
      "Admin email",
      currentEnv.PAYLOAD_ADMIN_EMAIL || "admin@example.com",
    )

    while (!isValidEmail(adminEmail)) {
      console.log("Enter a valid email address.")
      adminEmail = await askText(rl, "Admin email", currentEnv.PAYLOAD_ADMIN_EMAIL || "admin@example.com")
    }

    let adminPassword = await askPassword(
      rl,
      "Admin password (min 8 characters)",
      currentEnv.PAYLOAD_ADMIN_PASSWORD || "",
    )

    while (adminPassword && adminPassword.length < 8) {
      console.log("Admin password must be at least 8 characters.")
      adminPassword = await askPassword(rl, "Admin password (min 8 characters)", currentEnv.PAYLOAD_ADMIN_PASSWORD || "")
    }

    const seedTargetLabel =
      databaseUpdates.DATABASE_URL === LOCAL_DATABASE_URL
        ? "the fresh local database"
        : "the selected development database"
    const seedNow = await askYesNo(
      rl,
      `Seed baseline data into ${seedTargetLabel} now? This can overwrite existing content.`,
      false,
    )
    const eraseExisting = seedNow
      ? await askYesNo(rl, "Erase existing data before seeding?", false)
      : false

    while (seedNow && adminPassword.length < 8) {
      console.log("Seeding needs an admin password with at least 8 characters.")
      adminPassword = await askPassword(rl, "Admin password (min 8 characters)", "")
    }

    const includeBlog = seedNow
      ? await askYesNo(rl, "Include blog content during seed?", true)
      : false

    return {
      siteName,
      databaseUpdates,
      publicUrl,
      generateSecrets,
      enableAiNow,
      adminName,
      adminEmail,
      adminPassword,
      seedNow,
      eraseExisting,
      includeBlog,
    }
  } finally {
    rl.close()
  }
}

async function main() {
  const paths = getProjectPaths(process.cwd())
  const createdEnv = copyEnvExampleIfMissing(paths)
  const currentEnvText = readText(paths.envPath)
  const currentEnv = parseEnv(currentEnvText)
  const currentConfigText = readText(paths.configPath)
  const aiEnabled = readAiEnabled(currentConfigText)
  const isInteractive = Boolean(process.stdin.isTTY && process.stdout.isTTY)
  let updates = deriveBootstrapEnvUpdates(currentEnv)
  let nextAiEnabled = aiEnabled
  let nextSiteName = readSiteName(currentConfigText) || "Smart Site"
  let seedSelection = {
    eraseExisting: false,
    seedNow: false,
    includeBlog: false,
  }

  if (isInteractive) {
    const choices = await collectInteractiveChoices(currentEnv, aiEnabled)

    updates = {
      ...updates,
      ...choices.databaseUpdates,
      NEXT_PUBLIC_URL: choices.publicUrl,
      PAYLOAD_ADMIN_NAME: choices.adminName,
      PAYLOAD_ADMIN_EMAIL: choices.adminEmail,
      PAYLOAD_ADMIN_PASSWORD: choices.adminPassword,
    }

    if (!choices.generateSecrets && !choices.seedNow) {
      delete updates.PAYLOAD_SECRET
      delete updates.PREVIEW_SECRET
    }

    if (choices.siteName !== nextSiteName) {
      const nextConfigText = setSiteName(readText(paths.configPath), choices.siteName)
      writeText(paths.configPath, nextConfigText)
      nextSiteName = choices.siteName
    }

    if (choices.enableAiNow) {
      const nextConfigText = setAiEnabled(readText(paths.configPath), true)
      writeText(paths.configPath, nextConfigText)
      nextAiEnabled = true
    }

    seedSelection = {
      eraseExisting: choices.eraseExisting,
      seedNow: choices.seedNow,
      includeBlog: choices.includeBlog,
    }
  }

  if (Object.keys(updates).length > 0) {
    const nextText = upsertEnvValues(currentEnvText, updates)
    writeText(paths.envPath, nextText)
  }

  const nextEnv = parseEnv(readText(paths.envPath))
  const health = summarizeEnvHealth(nextEnv)

  console.log("SmartSite bootstrap")
  console.log("")

  if (createdEnv) {
    console.log("- created .env from .env.example")
  } else {
    console.log("- kept existing .env")
  }

  if (Object.keys(updates).length > 0) {
    console.log(isInteractive ? "- updated configuration:" : "- filled safe local defaults:")

    for (const key of Object.keys(updates)) {
      console.log(`  - ${key}`)
    }
  } else {
    console.log("- no env defaults needed")
  }

  console.log(`- AI default: ${nextAiEnabled ? "enabled" : "disabled"}`)
  console.log(`- site name: ${nextSiteName}`)
  console.log("")
  console.log("Current readiness:")
  console.log(`- DATABASE_URL: ${health.hasDatabaseUrl ? "ok" : "needs attention"}`)
  console.log(`- PAYLOAD_SECRET: ${health.hasPayloadSecret ? "ok" : "missing"}`)
  console.log(`- PREVIEW_SECRET: ${health.hasPreviewSecret ? "ok" : "missing"}`)
  console.log(`- NEXT_PUBLIC_URL: ${health.hasPublicUrl ? "ok" : "missing"}`)
  console.log("")
  console.log("Next steps:")
  console.log("1. Start local MongoDB if it is not already running.")
  console.log("2. Review .env and adjust any project-specific values.")
  console.log("3. Run `pnpm dev`.")
  console.log("4. Seed only if you explicitly want baseline data in a fresh local database.")

  if (nextAiEnabled) {
    console.log("5. Provision the AI key with `npx smartsite ai rotate --project .`.")
  }

  if (seedSelection.seedNow) {
    console.log("")
    console.log("Starting local dev server and performing the one-time seed...")

    await runLocalSeedWorkflow({
      assumeYes: true,
      eraseExisting: seedSelection.eraseExisting,
      includeBlog: seedSelection.includeBlog,
      projectRoot: paths.projectRoot,
      siteName: nextSiteName,
      startDevIfNeeded: true,
      targetUrl: nextEnv.NEXT_PUBLIC_URL || DEFAULT_PUBLIC_URL,
    })
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
