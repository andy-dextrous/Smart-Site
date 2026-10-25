import { mkdir, readFile, writeFile, rename, open, unlink } from "node:fs/promises"
import path from "node:path"
import { randomUUID } from "node:crypto"
import { execFileSync, spawn } from "node:child_process"
import net from "node:net"
export const root = process.cwd()
export const local = path.join(root, ".smartsite/local")
export const readJSON = async file => JSON.parse(await readFile(file, "utf8"))
export async function atomicJSON(file, value) {
  await mkdir(path.dirname(file), { recursive: true, mode: 0o700 })
  const tmp = `${file}.${randomUUID()}.tmp`
  await writeFile(tmp, JSON.stringify(value, null, 2) + "\n", { mode: 0o600 })
  await rename(tmp, file)
}
export async function loadState() {
  return readJSON(path.join(local, "state.json"))
}
export async function saveState(state) {
  await atomicJSON(path.join(local, "state.json"), state)
}
export function alive(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}
export function processIdentity(pid) {
  try {
    return execFileSync("ps", ["-p", String(pid), "-o", "lstart="], {
      encoding: "utf8",
    }).trim()
  } catch {
    return null
  }
}
export function owned(processState) {
  return Boolean(
    processState?.pid &&
    processState.identity &&
    processIdentity(processState.pid) === processState.identity
  )
}
export async function lock() {
  await mkdir(local, { recursive: true, mode: 0o700 })
  const file = path.join(local, "setup.lock")
  try {
    const handle = await open(file, "wx", 0o600)
    await handle.writeFile(
      JSON.stringify({ pid: process.pid, identity: processIdentity(process.pid) })
    )
    await handle.close()
  } catch (error) {
    if (error.code !== "EEXIST") throw error
    let owner
    try {
      owner = await readJSON(file)
    } catch {
      throw new Error("Unfinished setup lock; inspect before removing it")
    }
    if (alive(owner.pid))
      throw new Error("Another setup owns this project; wait for it to finish")
    await unlink(file)
    return lock()
  }
  return () => unlink(file)
}
export async function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.on("error", reject)
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port
      server.close(() => resolve(port))
    })
  })
}
export const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
export async function waitFor(fn, timeout = 60000) {
  const start = Date.now()
  let last
  while (Date.now() - start < timeout) {
    try {
      const result = await fn()
      if (result) return result
    } catch (error) {
      last = error
    }
    await delay(500)
  }
  throw new Error(`Readiness timeout${last ? ": " + last.message : ""}`)
}
export function cleanEnvironment(extra = {}) {
  const env = {}
  for (const key of [
    "PATH",
    "HOME",
    "USERPROFILE",
    "TMPDIR",
    "TEMP",
    "SystemRoot",
    "LANG",
  ])
    if (process.env[key]) env[key] = process.env[key]
  return { ...env, NEXT_TELEMETRY_DISABLED: "1", ...extra }
}
export async function runNode(args, env, logFile) {
  const file = await open(logFile, "a", 0o600)
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: root,
      env,
      stdio: ["ignore", file.fd, file.fd],
    })
    const interrupted = () => child.kill("SIGTERM")
    process.once("SIGTERM", interrupted)
    process.once("SIGINT", interrupted)
    const finish = async () => {
      process.removeListener("SIGTERM", interrupted)
      process.removeListener("SIGINT", interrupted)
      await file.close()
    }
    child.on("error", async error => {
      await finish()
      reject(error)
    })
    child.on("exit", async code => {
      await finish()
      code === 0
        ? resolve()
        : reject(
            new Error(
              `Project helper failed (${code}); inspect ${path.relative(root, logFile)} privately`
            )
          )
    })
  })
}
