import { randomBytes, randomUUID } from "node:crypto"
import { access, readFile, writeFile, mkdir } from "node:fs/promises"
import path from "node:path"
import {
  root,
  local,
  lock,
  readJSON,
  atomicJSON,
  loadState,
  saveState,
  freePort,
  runNode,
} from "./local/state.mjs"
import { ensureDatabase, databaseURL } from "./local/database.mjs"
import { environment, startApp } from "./local/runtime.mjs"
import { configureClients, mcpRequest } from "./local/clients.mjs"
const unlock = await lock()
try {
  if (process.platform === "win32")
    throw new Error(
      "Native Windows process ownership is not supported yet. Use the documented Linux environment (for example WSL) or an explicitly managed deployment; do not run partial local setup."
    )
  if (
    Number(process.versions.node.split(".")[0]) !== 24 ||
    process.versions.node.localeCompare("24.22.1", undefined, { numeric: true }) < 0
  )
    throw new Error("Use Node 24.22.1 or a newer Node 24 patch release")
  const arg = process.argv.indexOf("--request")
  const request =
    arg >= 0
      ? await readJSON(path.resolve(process.argv[arg + 1]))
      : { schemaVersion: 1, siteName: "My SmartSite" }
  if (
    request.schemaVersion !== 1 ||
    (request.projectRoot && path.resolve(request.projectRoot) !== root)
  )
    throw new Error("Invalid setup request version or projectRoot")
  let state
  try {
    state = await loadState()
  } catch (error) {
    if (error.code !== "ENOENT") throw error
  }
  if (!state) {
    try {
      await access(path.join(root, ".env"))
      throw new Error(
        "Existing .env requires inspection. Bootstrap will not overwrite or adopt it."
      )
    } catch (error) {
      if (error.code !== "ENOENT") throw error
    }
    const siteId = randomUUID()
    state = {
      schemaVersion: 1,
      siteId,
      projectRoot: root,
      siteName: request.siteName || "My SmartSite",
      email: request.email || "owner@smartsite.local",
      databaseName: `smartsite_${siteId.replaceAll("-", "")}`,
      replicaSet: `ss_${siteId.slice(0, 8)}`,
      databasePort: await freePort(),
      appPort: await freePort(),
      stage: "discovered",
    }
    const credentials = {
      databasePassword: randomBytes(24).toString("hex"),
      replicaKey: randomBytes(48).toString("base64"),
      adminPassword: randomBytes(24).toString("base64url"),
      payloadSecret: randomBytes(32).toString("hex"),
      mcpKey: randomBytes(32).toString("hex"),
    }
    await atomicJSON(path.join(local, "credentials.json"), credentials)
    await saveState(state)
  }
  if (state.projectRoot !== root)
    throw new Error(
      "Copied local state detected. Keep it for recovery; create a fresh clone without private state."
    )
  const credentials = await readJSON(path.join(local, "credentials.json"))
  // A previous interrupted first run may not have written the env yet.
  try {
    await access(path.join(root, ".env"))
  } catch (error) {
    if (error.code !== "ENOENT") throw error
    const values = {
      DATABASE_PROVIDER: "mongoose",
      DATABASE_URL: databaseURL(state, credentials),
      PAYLOAD_SECRET: credentials.payloadSecret,
      SMARTSITE_SITE_ID: state.siteId,
      SMARTSITE_ENVIRONMENT: "local",
      NEXT_PUBLIC_URL: `http://127.0.0.1:${state.appPort}`,
      PREVIEW_SECRET: randomBytes(24).toString("hex"),
    }
    await writeFile(
      path.join(root, ".env"),
      Object.entries(values)
        .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
        .join("\n") + "\n",
      { flag: "wx", mode: 0o600 }
    )
  }
  await environment(state)
  await mkdir(path.join(root, "public/media"), { recursive: true })
  state.stage = "prerequisites-ready"
  await saveState(state)
  await ensureDatabase(state, credentials)
  state.stage = "database-ready"
  await saveState(state)
  await runNode(
    ["--import", "tsx", "scripts/local/provision.ts"],
    await environment(state),
    path.join(local, "provision.log")
  )
  state.stage = "essentials-ready"
  await saveState(state)
  if (process.argv.includes("--prepare-only")) {
    console.log(JSON.stringify({ status: "essentials-ready", siteId: state.siteId }))
    process.exitCode = 0
  } else {
    await startApp(state)
    state.stage = "app-ready"
    await saveState(state)
    await configureClients(state)
    state.stage = "client-configured"
    await saveState(state)
    const catalogue = await mcpRequest(state, credentials, "tools/call", {
      name: "smartsiteRead",
      arguments: { action: "catalogue" },
    })
    const identity = JSON.parse(catalogue.content[0].text)
    if (identity.siteId !== state.siteId) throw new Error("MCP identity mismatch")
    state.serverMcpVerified = true
    await saveState(state)
    console.log(
      JSON.stringify({
        status: "client-action-required",
        siteId: state.siteId,
        url: `http://127.0.0.1:${state.appPort}`,
        next: "Reconnect the project MCP server in your client; accept its normal trust prompt if requested. Call smartsiteRead catalogue from the client. Private local account details are in .smartsite/local/credentials.json.",
      })
    )
  }
} finally {
  await unlock()
}
