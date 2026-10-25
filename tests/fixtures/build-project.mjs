import { readdir, rm, readFile, mkdir, writeFile } from "node:fs/promises"
import { spawn } from "node:child_process"
import { parse } from "dotenv"
import { cleanEnvironment, local, loadState } from "../../scripts/local/state.mjs"
import { stopProcess } from "../../scripts/local/runtime.mjs"

const files = await readdir(".")
if (
  files.some(file => file.startsWith(".env") && !file.endsWith(".example")) ||
  files.includes(".smartsite")
)
  throw new Error(
    "Build fixture requires a clean export without environment files or private state"
  )
const run = (args, env) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { env, stdio: "inherit" })
    child.on("error", reject)
    child.on("exit", code =>
      code === 0 ? resolve() : reject(new Error(`Fixture child exited ${code}`))
    )
  })
try {
  await run(["scripts/bootstrap-smartsite.mjs", "--prepare-only"], cleanEnvironment())
  const values = parse(await readFile(".env"))
  if (
    values.SMARTSITE_ENVIRONMENT !== "local" ||
    !values.DATABASE_URL.includes("127.0.0.1:")
  )
    throw new Error("Disposable fixture identity mismatch")
  const env = cleanEnvironment({ ...values, NODE_ENV: "production" })
  await run(["node_modules/payload/bin.js", "generate:types"], env)
  await run(["node_modules/payload/bin.js", "generate:importmap"], env)
  await run(["--import", "tsx", "scripts/generate-sitemap-index.ts"], env)
  if (process.argv.includes("--force-failure")) await run(["-e", "process.exit(17)"], env)
  else await run(["node_modules/next/dist/bin/next", "build"], env)
} finally {
  let stopped = false
  try {
    const state = await loadState()
    await stopProcess(state.appProcess)
    await stopProcess(state.databaseProcess)
    stopped = true
  } catch (error) {
    console.error("Fixture cleanup needs inspection:", error.message)
  }
  if (stopped) {
    await rm(".env", { force: true })
    await rm(local, { recursive: true, force: true })
    await rm(".smartsite", { recursive: true, force: true })
  }
}
