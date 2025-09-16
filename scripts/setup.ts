import fs from "fs-extra"
import path from "path"
import inquirer from "inquirer"
import ora from "ora"
import chalk from "chalk"
import { execa } from "execa"
import http from "http"
import { randomBytes } from "crypto"

/*************************************************************************/
/*  INTERACTIVE STARTUP SETUP
/*************************************************************************/

async function main() {
  const appRoot = findAppRoot(process.cwd())
  const envPath = path.join(appRoot, ".env")
  const envExamplePath = path.join(appRoot, ".env.example")

  const summary: Record<string, unknown> = {}

  // Detect if any real env files already exist (to warn about overwrite)
  const preExistingEnvFiles = await listExistingEnvFiles(appRoot)

  await ensureEnvFile(envPath, envExamplePath)
  const currentEnv = await readEnv(envPath)

  const { port } = await askPort()
  const { dbProvider, dbUrl } = await askDatabase(currentEnv)
  const { storageProvider, blobToken } = await askStorage()
  const { adminEmail, adminPassword } = await askAdmin(currentEnv)

  summary.port = port
  summary.dbProvider = dbProvider
  summary.storage = storageProvider

  const updatedEnv = { ...currentEnv }
  // Always align public URL to selected port for local dev
  updatedEnv.NEXT_PUBLIC_URL = `http://localhost:${port}`
  updatedEnv.DATABASE_PROVIDER = dbProvider
  updatedEnv.DATABASE_URL = dbUrl
  updatedEnv.PAYLOAD_ADMIN_EMAIL = adminEmail
  updatedEnv.PAYLOAD_ADMIN_PASSWORD = adminPassword
  if (storageProvider === "vercel-blob" && blobToken) {
    updatedEnv.BLOB_READ_WRITE_TOKEN = blobToken
  }

  // Ensure required secrets exist before starting server/seed
  ensureSecrets(updatedEnv)

  if (preExistingEnvFiles.length > 0) {
    console.log(
      chalk.yellow(
        `⚠ Found existing env files (${preExistingEnvFiles.join(", ")}). The .env file will be overwritten with your selections.`
      )
    )
  }

  await writeEnvFromTemplate(envPath, envExamplePath, updatedEnv, dbProvider)

  await ensureDbAdapters(appRoot)
  await applyStorageProvider(appRoot, storageProvider)
  await updateScriptsPort(appRoot, port)

  // Dependencies should be installed before running this script.
  // Skipping in-script installation to keep behavior predictable.

  const { doSeed, blog } = await askSeed()
  if (doSeed) {
    const { keepRunning } = await runDevAndSeed(appRoot, port, { blog })
    summary.seedProfile = "minimal"
    summary.blog = blog
    summary.devLeftRunning = keepRunning
  }

  printSummary(summary)
}

/*************************************************************************/
/*  PROMPTS
/*************************************************************************/

async function askPort() {
  const defaultPort = 3010
  const answers = await inquirer.prompt([
    {
      type: "number",
      name: "port",
      message: "Development port",
      default: defaultPort,
      validate: async (val: number) => (await isPortFree(val)) || `Port ${val} is in use`,
    },
  ])
  return answers as { port: number }
}

async function askDatabase(env: Record<string, string>) {
  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "dbProvider",
      message: "Database provider",
      choices: [
        { name: "MongoDB (mongoose)", value: "mongoose" },
        { name: "PostgreSQL (postgres)", value: "postgres" },
      ],
      default: env.DATABASE_PROVIDER === "postgres" ? "postgres" : "mongoose",
    },
    {
      type: "input",
      name: "dbUrl",
      message: "Database URL",
      default: (ans: any) =>
        ans.dbProvider === "mongoose"
          ? "mongodb://localhost:27017/smart-site-setup-test"
          : "postgres://user:password@localhost:5432/smart_site_setup_test",
      validate: (v: string) => (!!v && v.includes("://")) || "Enter a valid connection string",
    },
  ])
  return answers as { dbProvider: "mongoose" | "postgres"; dbUrl: string }
}

async function askStorage() {
  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "storageProvider",
      message: "Media storage",
      choices: [
        { name: "Local (development only)", value: "local" },
        { name: "Vercel Blob", value: "vercel-blob" },
      ],
      default: "local",
    },
    {
      type: "input",
      name: "blobToken",
      message: "Vercel Blob Read/Write Token",
      when: (ans: any) => ans.storageProvider === "vercel-blob",
      validate: (v: string) => (!!v && v.length > 10) || "Enter a valid token",
    },
  ])

  if ((answers as any).storageProvider === "local") {
    console.log(
      chalk.yellow(
        "⚠ Local storage selected. Files are stored on disk; re-upload will be required for production."
      )
    )
  }

  return answers as { storageProvider: "local" | "vercel-blob"; blobToken?: string }
}

async function askSeed() {
  const answers = await inquirer.prompt([
    { type: "confirm", name: "doSeed", message: "Seed database now?", default: true },
    {
      type: "confirm",
      name: "blog",
      message: "Include a blog (posts + insights page)?",
      default: false,
      when: (ans: any) => ans.doSeed,
    },
  ])
  return answers as { doSeed: boolean; blog: boolean }
}

async function askAdmin(env: Record<string, string>) {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "adminEmail",
      message: "Admin email (required)",
      default: env.PAYLOAD_ADMIN_EMAIL && !/create any|\.\.\./i.test(env.PAYLOAD_ADMIN_EMAIL)
        ? env.PAYLOAD_ADMIN_EMAIL
        : "admin@example.com",
      validate: (v: string) => /.+@.+\..+/.test(v) || "Enter a valid email",
    },
    {
      type: "password",
      name: "adminPassword",
      message: "Admin password (min 8 chars)",
      mask: "*",
      validate: (v: string) => (v && v.length >= 8) || "Minimum 8 characters",
    },
  ])
  return answers as { adminEmail: string; adminPassword: string }
}

/*************************************************************************/
/*  ENV MANAGEMENT
/*************************************************************************/

async function ensureEnvFile(envPath: string, examplePath: string) {
  if (await fs.pathExists(envPath)) return
  if (await fs.pathExists(examplePath)) {
    await fs.copy(examplePath, envPath)
    return
  }
  await fs.writeFile(envPath, "")
}

async function listExistingEnvFiles(dir: string) {
  try {
    const entries = await fs.readdir(dir)
    return entries.filter((name) => name.startsWith(".env") && !name.includes("example"))
  } catch {
    return []
  }
}

async function readEnv(file: string) {
  if (!(await fs.pathExists(file))) return {}
  const content = await fs.readFile(file, "utf8")
  const out: Record<string, string> = {}
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue
    const idx = line.indexOf("=")
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    const val = line.slice(idx + 1).trim().replace(/^"|"$/g, "")
    if (key) out[key] = val
  }
  return out
}

async function writeEnvFromTemplate(envPath: string, examplePath: string, env: Record<string, string>, dbProvider: "mongoose" | "postgres") {
  // Read example content as the base structure
  const template = await fs.readFile(examplePath, "utf8")
  let lines = template.split(/\r?\n/)

  // Helper: replace a key in-place while preserving trailing comment
  function replaceKeyInline(key: string, value: string) {
    const rx = new RegExp(`^(${key}=)(.*?)(\n|\r|$)`) // simple match without caring for inline comment
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line.startsWith(`${key}=`)) {
        // Preserve trailing inline comment if present
        const hashIdx = line.indexOf("#")
        const suffix = hashIdx >= 0 ? line.slice(hashIdx) : ""
        const spacer = suffix ? " " : ""
        lines[i] = `${key}=${escapeEnv(value)}${spacer}${suffix}`
        return
      }
    }
    // If the key doesn't exist in the template, append it
    lines.push(`${key}=${escapeEnv(value)}`)
  }

  // Process database provider blocks: keep only the chosen one
  const idxMongo = lines.findIndex(l => l.startsWith("# IF USING MONGODB"))
  const idxPost = lines.findIndex(l => l.startsWith("# IF USING POSTGRES"))

  function removeBlock(startIdx: number) {
    if (startIdx < 0) return
    const end = Math.min(lines.length, startIdx + 3) // header + 2 lines
    lines.splice(startIdx, end - startIdx)
  }

  if (dbProvider === "mongoose") {
    // Ensure Mongo block is active
    if (idxMongo >= 0) {
      if (idxMongo + 1 < lines.length) lines[idxMongo + 1] = `DATABASE_PROVIDER=mongoose`
      if (idxMongo + 2 < lines.length) lines[idxMongo + 2] = `DATABASE_URL=${escapeEnv(env.DATABASE_URL)}`
    }
    // Remove Postgres example block entirely
    removeBlock(idxPost)
  } else {
    // Remove Mongo block entirely
    removeBlock(idxMongo)
    // Activate Postgres block (header retained)
    if (idxPost >= 0) {
      // The example has commented lines; replace them with active ones
      if (idxPost + 1 < lines.length) lines[idxPost + 1] = `DATABASE_PROVIDER=postgres`
      if (idxPost + 2 < lines.length) lines[idxPost + 2] = `DATABASE_URL=${escapeEnv(env.DATABASE_URL)}`
    } else {
      // If header missing, append a small block
      lines.unshift(`DATABASE_URL=${escapeEnv(env.DATABASE_URL)}`)
      lines.unshift(`DATABASE_PROVIDER=postgres`)
      lines.unshift(`# IF USING POSTGRES`)
    }
  }

  // Replace known keys with selected values, preserving inline comments
  const keysToReplace = [
    "PAYLOAD_SECRET",
    "PREVIEW_SECRET",
    "BLOB_READ_WRITE_TOKEN",
    "RESEND_API_KEY",
    "PAYLOAD_CONFIG_PATH",
    "NEXT_PUBLIC_URL",
    "NEXT_PUBLIC_AI_URL",
    "PAYLOAD_ADMIN_EMAIL",
    "PAYLOAD_ADMIN_PASSWORD",
  ]
  for (const key of keysToReplace) {
    if (env[key]) replaceKeyInline(key, env[key])
  }

  // Ensure newline at EOF and write
  const out = lines.join("\n").replace(/\n*$/, "\n")
  await fs.writeFile(envPath, out, "utf8")
}

function escapeEnv(v: string) {
  if (/[\s#]/.test(v)) return JSON.stringify(v)
  return v
}

/*************************************************************************/
/*  APPLY CHOICES (PACKAGE + CONFIG)
/*************************************************************************/

async function ensureDbAdapters(appRoot: string) {
  const pkgPath = path.join(appRoot, "package.json")
  if (!(await fs.pathExists(pkgPath))) return
  const pkg = await fs.readJSON(pkgPath)
  pkg.dependencies = pkg.dependencies || {}
  const wantVersion = pkg.dependencies["@payloadcms/next"] || pkg.dependencies["payload"] || "3.54.0"
  let changed = false
  if (!pkg.dependencies["@payloadcms/db-mongodb"]) {
    pkg.dependencies["@payloadcms/db-mongodb"] = wantVersion
    changed = true
  }
  if (!pkg.dependencies["@payloadcms/db-postgres"]) {
    pkg.dependencies["@payloadcms/db-postgres"] = wantVersion
    changed = true
  }
  if (changed) {
    await fs.writeJSON(pkgPath, pkg, { spaces: 2 })
    console.log(
      chalk.yellow(
        "Updated package.json to include both @payloadcms/db-mongodb and @payloadcms/db-postgres. Run pnpm install to apply."
      )
    )
  }
}

async function applyStorageProvider(appRoot: string, provider: "local" | "vercel-blob") {
  const configPath = resolveSmartsiteConfig(appRoot)
  if (!configPath) return
  let source = await fs.readFile(configPath, "utf8")
  const want = provider === "vercel-blob" ? "vercel-blob" : "local"
  source = source.replace(/provider:\s*"(local|vercel-blob)"/, `provider: "${want}"`)
  await fs.writeFile(configPath, source)
}

function resolveSmartsiteConfig(appRoot: string) {
  const p = path.join(appRoot, "src", "smartsite.config.ts")
  return fs.existsSync(p) ? p : null
}

function ensureSecrets(env: Record<string, string>) {
  const isPlaceholder = (v?: string) =>
    !v || /create any random secret|string|short nanoid|\.\.\./i.test(v) || v === '"# create any random secret string"'

  if (isPlaceholder(env.PAYLOAD_SECRET)) {
    env.PAYLOAD_SECRET = randomBytes(32).toString("hex")
  }
  if (isPlaceholder(env.PREVIEW_SECRET)) {
    env.PREVIEW_SECRET = randomBytes(16).toString("hex")
  }
}

async function updateScriptsPort(appRoot: string, port: number) {
  const pkgPath = path.join(appRoot, "package.json")
  if (!(await fs.pathExists(pkgPath))) return
  const pkg = await fs.readJSON(pkgPath)
  if (!pkg.scripts) return
  const replacePort = (s: string) => s.replace(/http:\/\/localhost:\d+/g, `http://localhost:${port}`).replace(/kill-port \d+/g, `kill-port ${port}`)
  const newScripts: Record<string, string> = {}
  for (const [k, v] of Object.entries<string>(pkg.scripts)) {
    newScripts[k] = typeof v === "string" ? replacePort(v) : v
  }
  pkg.scripts = newScripts
  await fs.writeJSON(pkgPath, pkg, { spaces: 2 })
}

/*************************************************************************/
/*  DEV + SEED
/*************************************************************************/

async function runDevAndSeed(cwd: string, port: number, options: { blog?: boolean }) {
  const spinner = ora("Starting dev server...").start()
  const child = execa(
    "pnpm",
    ["exec", "next", "dev", "-p", String(port), "--turbo"],
    { cwd, env: { ...process.env, NODE_OPTIONS: "--no-deprecation", PORT: String(port) } }
  )
  // Prevent unhandled rejection when we later kill the process intentionally
  void child.catch(() => {})
  // Stream logs while waiting so users see progress/errors
  child.stdout?.on("data", (d) => process.stdout.write(d))
  child.stderr?.on("data", (d) => process.stderr.write(d))

  let isReady = false
  const exitPromise = new Promise<void>((_resolve, reject) => {
    child.on("exit", (code) => {
      if (!isReady) {
        reject(new Error(`Dev server exited before becoming ready (code ${code})`))
      }
    })
  })

  try {
    await Promise.race([
      waitForServer(`http://localhost:${port}/api/seed`, 180_000),
      exitPromise,
    ])
    isReady = true
    spinner.succeed("Dev server is running")
  } catch (e) {
    spinner.fail("Dev server failed to start")
    throw e
  }

  const seedSpinner = ora(`Seeding database (minimal${options.blog ? " + blog" : ""})...`).start()
  try {
    const res = await fetch(`http://localhost:${port}/api/seed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blog: !!options.blog }),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Seed failed: ${res.status} ${text}`)
    }
    seedSpinner.succeed("Seed completed")
    // Allow trailing server logs from hooks to flush before prompting the user
    await delay(1200)
    console.log(chalk.green("✔ Seed complete"))
  } catch (e: any) {
    seedSpinner.fail("Seed failed")
    throw e
  }

  const { keepRunning } = await inquirer.prompt([
    { type: "confirm", name: "keepRunning", message: "Leave dev server running?", default: true },
  ])

  if (!keepRunning) {
    try {
      child.kill("SIGINT")
      await new Promise<void>((resolve) => child.on("exit", () => resolve()))
    } catch {}
  } else {
    child.stdout?.pipe(process.stdout)
    child.stderr?.pipe(process.stderr)
  }

  return { keepRunning }
}

async function waitForServer(url: string, timeoutMs: number) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    try {
      const ok = await tryHead(url)
      if (ok) return
    } catch {}
    await delay(500)
  }
  throw new Error("Timeout waiting for server")
}

async function tryHead(raw: string) {
  const { hostname, port, pathname } = new URL(raw)
  return new Promise<boolean>((resolve) => {
    const done = (ok: boolean) => resolve(ok)
    const onError = () => {
      const getReq = http.request(
        { method: "GET", hostname, port, path: pathname || "/" },
        (res) => done(res.statusCode ? res.statusCode < 500 : false)
      )
      getReq.on("error", () => done(false))
      getReq.setTimeout(1500, () => {
        getReq.destroy()
        done(false)
      })
      getReq.end()
    }
    const req = http.request(
      { method: "HEAD", hostname, port, path: pathname || "/" },
      (res) => done(res.statusCode ? res.statusCode < 500 : false)
    )
    req.on("error", onError)
    req.setTimeout(1500, () => {
      req.destroy()
      onError()
    })
    req.end()
  })
}

async function isPortFree(port: number) {
  return new Promise<boolean>((resolve) => {
    const srv = http.createServer(() => {})
    srv.listen(port, "127.0.0.1", () => {
      srv.close(() => resolve(true))
    })
    srv.on("error", () => resolve(false))
  })
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

/*************************************************************************/
/*  UTILITIES
/*************************************************************************/

function findAppRoot(start: string): string {
  let dir = start
  while (true) {
    const pkg = path.join(dir, "package.json")
    if (fs.existsSync(pkg)) return dir
    const parent = path.dirname(dir)
    if (parent === dir) return start
    dir = parent
  }
}

function printSummary(summary: Record<string, unknown>) {
  console.log("")
  console.log(chalk.green("✔ Setup complete"))
  console.log(chalk.gray(JSON.stringify(summary, null, 2)))
}

main().catch((e) => {
  console.error(chalk.red("✖"), e?.message || e)
  process.exit(1)
})
