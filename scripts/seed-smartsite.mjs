import { execa } from "execa"
import process from "node:process"
import readline from "node:readline/promises"
import { pathToFileURL } from "node:url"
import {
  createSeedProof,
  createSeedSiteId,
  getProjectPaths,
  parseEnv,
  readSiteName,
  readText,
  summarizeEnvHealth,
} from "./smartsite-local-tools.mjs"

/*************************************************************************/
/*  SMARTSITE LOCAL SEED
/*************************************************************************/

function normalizeBaseUrl(url) {
  return (url || "http://localhost:3000").replace(/\/+$/, "")
}

function extractPort(url) {
  try {
    const parsed = new URL(url)

    if (parsed.port) {
      return Number(parsed.port)
    }

    return parsed.protocol === "https:" ? 443 : 3000
  } catch {
    return 3000
  }
}

function isLocalhostUrl(url) {
  try {
    const parsed = new URL(url)
    return ["127.0.0.1", "localhost"].includes(parsed.hostname)
  } catch {
    return false
  }
}

async function waitForServer(url, timeoutMs = 60_000) {
  const started = Date.now()

  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url, { method: "GET" })

      if (response.status < 500) {
        return response
      }
    } catch {}

    await new Promise(resolve => setTimeout(resolve, 500))
  }

  throw new Error(`Timeout waiting for ${url}`)
}

async function handshakeSeedTarget(baseUrl, identity) {
  const response = await fetch(new URL("/api/seed", `${baseUrl}/`), {
    method: "GET",
    headers: {
      "x-smartsite-site-id": identity.siteId,
      "x-smartsite-seed-proof": identity.seedProof,
    },
  })

  if (response.status === 403) {
    const error = new Error(
      "Seed handshake failed. The running site does not match this SmartSite project or the local seed proof is invalid.",
    )
    error.code = "SEED_SITE_MISMATCH"
    throw error
  }

  if (!response.ok) {
    throw new Error(`Seed handshake failed (${response.status}).`)
  }

  const data = await response.json()

  if (data?.siteId !== identity.siteId) {
    throw new Error("Seed handshake failed. The running site ID did not match this project.")
  }

  return data
}

async function executeSeedRequest(baseUrl, identity, payload) {
  const response = await fetch(new URL("/api/seed", `${baseUrl}/`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-smartsite-site-id": identity.siteId,
      "x-smartsite-seed-proof": identity.seedProof,
    },
    body: JSON.stringify(payload),
  })

  const text = await response.text()

  if (!response.ok) {
    throw new Error(`Seed failed (${response.status}): ${text}`)
  }

  try {
    const data = JSON.parse(text)
    return data?.message || "Seed completed"
  } catch {
    return text || "Seed completed"
  }
}

async function confirmSeed(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  try {
    const answer = (await rl.question(`${message} [y/N]: `)).trim().toLowerCase()
    return answer === "y" || answer === "yes"
  } finally {
    rl.close()
  }
}

async function askYesNo(message, defaultValue = false) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  try {
    const suffix = defaultValue ? " [Y/n]" : " [y/N]"
    const answer = (await rl.question(`${message}${suffix}: `)).trim().toLowerCase()

    if (!answer) {
      return defaultValue
    }

    return answer === "y" || answer === "yes"
  } finally {
    rl.close()
  }
}

export async function runLocalSeedWorkflow(options = {}) {
  const projectRoot = options.projectRoot || process.cwd()
  const paths = getProjectPaths(projectRoot)
  const env = parseEnv(readText(paths.envPath))
  const configText = readText(paths.configPath)
  const siteName = (options.siteName || readSiteName(configText) || "Smart Site").trim()
  const targetUrl = normalizeBaseUrl(options.targetUrl || env.NEXT_PUBLIC_URL)
  const health = summarizeEnvHealth(env)

  if (!health.hasPayloadSecret || !health.hasPreviewSecret) {
    throw new Error("Seeding requires PAYLOAD_SECRET and PREVIEW_SECRET in .env.")
  }

  const identity = {
    siteId: createSeedSiteId({
      payloadSecret: env.PAYLOAD_SECRET,
      publicUrl: targetUrl,
      siteName,
    }),
    seedProof: createSeedProof({
      payloadSecret: env.PAYLOAD_SECRET,
      previewSecret: env.PREVIEW_SECRET,
      publicUrl: targetUrl,
      siteName,
    }),
  }

  const includeBlog = options.includeBlog !== false
  const assumeYes = options.assumeYes === true
  const shouldStartDev = options.startDevIfNeeded !== false && isLocalhostUrl(targetUrl)
  let eraseExisting = options.eraseExisting === true

  if (!assumeYes && process.stdin.isTTY && process.stdout.isTTY) {
    const approved = await confirmSeed(
      `Seed baseline data at ${targetUrl}?`,
    )

    if (!approved) {
      throw new Error("Seed cancelled")
    }

    eraseExisting = await askYesNo("Erase existing data before seeding?", false)

    if (eraseExisting) {
      const destructiveApproved = await confirmSeed(
        `This will erase and replace data at ${targetUrl}. Continue?`,
      )

      if (!destructiveApproved) {
        throw new Error("Destructive seed cancelled")
      }
    }
  }

  let child = null
  let startedDev = false

  try {
    try {
      await handshakeSeedTarget(targetUrl, identity)
    } catch (error) {
      if (error?.code === "SEED_SITE_MISMATCH") {
        throw error
      }

      if (!shouldStartDev) {
        throw error
      }

      const port = extractPort(targetUrl)
      child = execa("pnpm", ["exec", "next", "dev", "-p", String(port)], {
        cwd: projectRoot,
        env: { ...process.env, NODE_OPTIONS: "--no-deprecation", PORT: String(port) },
      })
      startedDev = true
      child.stdout?.pipe(process.stdout)
      child.stderr?.pipe(process.stderr)

      process.on("SIGINT", () => child?.kill())
      process.on("SIGTERM", () => child?.kill())

      await waitForServer(new URL("/api/seed", `${targetUrl}/`).toString())
      await handshakeSeedTarget(targetUrl, identity)
    }

    const message = await executeSeedRequest(targetUrl, identity, {
      blog: includeBlog,
      confirmErase: eraseExisting,
      eraseExisting,
      siteName,
    })

    console.log("")
    console.log(message)

    if (startedDev) {
      console.log("Local dev server is still running.")
      console.log("Press Ctrl+C when you want to stop it.")
      await child
    }
  } catch (error) {
    if (child && startedDev) {
      child.kill()
    }

    throw error
  }
}

function parseCliArgs(argv) {
  return {
    includeBlog: !argv.includes("--no-blog"),
    assumeYes: argv.includes("--yes"),
  }
}

async function main() {
  const options = parseCliArgs(process.argv.slice(2))
  await runLocalSeedWorkflow(options)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}
