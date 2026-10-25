import { open, readFile } from "node:fs/promises"
import { spawn } from "node:child_process"
import path from "node:path"
import { parse } from "dotenv"
import { databaseURL } from "./database.mjs"
import {
  local,
  root,
  owned,
  alive,
  processIdentity,
  waitFor,
  delay,
  cleanEnvironment,
  saveState,
} from "./state.mjs"
export async function environment(state) {
  const values = parse(await readFile(path.join(root, ".env")))
  if (
    values.SMARTSITE_SITE_ID !== state.siteId ||
    values.SMARTSITE_ENVIRONMENT !== "local"
  )
    throw new Error(
      "Environment identity mismatch; inspect existing configuration before any mutation"
    )
  const credentials = JSON.parse(
    await readFile(path.join(local, "credentials.json"), "utf8")
  )
  if (
    values.DATABASE_PROVIDER !== "mongoose" ||
    values.DATABASE_URL !== databaseURL(state, credentials) ||
    values.SMARTSITE_DATABASE_TARGET ||
    values.STAGING_DATABASE_URL
  )
    throw new Error(
      "Local database configuration was changed; inspect before starting or provisioning"
    )
  return cleanEnvironment({ ...values, NODE_ENV: "development" })
}
export async function health(state) {
  const response = await fetch(`http://127.0.0.1:${state.appPort}/api/smartsite/health`, {
    signal: AbortSignal.timeout(3000),
  })
  const body = await response.json()
  if (
    !response.ok ||
    body.siteId !== state.siteId ||
    body.environment !== "local" ||
    body.database !== true
  )
    throw new Error("App identity or database readiness mismatch")
  return body
}
export async function startApp(state) {
  if (owned(state.appProcess)) {
    await waitFor(() => health(state), 120000)
    return
  }
  const file = await open(path.join(local, "app.log"), "a", 0o600)
  const child = spawn(
    process.execPath,
    [
      path.join(root, "node_modules/next/dist/bin/next"),
      "dev",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(state.appPort),
    ],
    {
      cwd: root,
      env: await environment(state),
      detached: true,
      stdio: ["ignore", file.fd, file.fd],
    }
  )
  await new Promise((resolve, reject) => {
    child.once("spawn", resolve)
    child.once("error", reject)
  })
  child.unref()
  await file.close()
  await delay(500)
  state.appProcess = { pid: child.pid, identity: processIdentity(child.pid) }
  await saveState(state)
  await waitFor(() => health(state), 180000)
}
export async function stopProcess(info) {
  if (!owned(info)) {
    if (info?.pid && alive(info.pid))
      throw new Error(
        "Process ownership no longer matches; preserve state and inspect before cleanup"
      )
    return false
  }
  process.kill(info.pid, "SIGTERM")
  await waitFor(() => !owned(info), 20000)
  return true
}
