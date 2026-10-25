import { access, readFile, stat } from "node:fs/promises"
import { constants } from "node:fs"
import { loadState, readJSON, local } from "./local/state.mjs"
import { inspectDatabase } from "./local/database.mjs"
import { health, environment } from "./local/runtime.mjs"
import { mcpRequest } from "./local/clients.mjs"
import { checkAdminReadiness } from "./local/admin-readiness.mjs"
const report = { status: "not-ready", checks: {} }
try {
  const state = await loadState(),
    credentials = await readJSON(`${local}/credentials.json`)
  report.siteId = state.siteId
  report.url = `http://127.0.0.1:${state.appPort}`
  for (const [name, check] of Object.entries({
    runtime: async () => {
      const [major, minor, patch] = process.versions.node.split(".").map(Number)
      if (major !== 24 || minor < 22 || (minor === 22 && patch < 1))
        throw new Error("Use the pinned Node 24.22.1 runtime")
      const installed = JSON.parse(
        await readFile("node_modules/payload/package.json", "utf8")
      )
      if (installed.version !== "3.92.0")
        throw new Error("Install the project lockfile before starting")
      return { node: process.versions.node, payload: installed.version }
    },
    admin: () => checkAdminReadiness(state),
    media: async () => {
      const info = await stat("public/media")
      if (!info.isDirectory()) throw new Error("Local media path is not a directory")
      await access("public/media", constants.W_OK | constants.R_OK)
      return { readable: true, writable: true }
    },
    database: () => inspectDatabase(state, credentials),
    app: () => health(state),
    publication: async () => {
      const env = await environment(state)
      const backgroundRecovery = env.SMARTSITE_BACKGROUND_RECOVERY === "true"
      if (backgroundRecovery && !env.CRON_SECRET?.trim())
        throw new Error("Opted-in background recovery requires a private CRON_SECRET")
      // Read status as the local operator; diagnostics must never execute due schedules.
      const login = await fetch(`${report.url}/api/users/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "owner", password: credentials.adminPassword }),
        signal: AbortSignal.timeout(30000),
      })
      if (!login.ok) throw new Error("Local operator authentication failed")
      const { token } = await login.json()
      const response = await fetch(`${report.url}/api/publication?status`, {
        headers: { authorization: `JWT ${token}` },
        signal: AbortSignal.timeout(30000),
      })
      if (!response.ok) throw new Error("Publication runner is unavailable")
      const status = await response.json()
      return {
        backgroundRecovery,
        recovery: backgroundRecovery ? "persistent-process" : "on-save-or-administrator-request",
        unfinished: status.total,
        failed: status.work.filter(work => work.status === "failed").length,
      }
    },
    mcp: async () => {
      if ((await health(state)).mcpEnabled === false)
        return { enabled: false, intentional: true }
      const result = await mcpRequest(state, credentials, "tools/call", {
        name: "smartsiteRead",
        arguments: { action: "catalogue" },
      })
      if (JSON.parse(result.content[0].text).siteId !== state.siteId)
        throw new Error("MCP identity mismatch")
      return { authenticated: true }
    },
  })) {
    try {
      report.checks[name] = await check()
    } catch (error) {
      report.checks[name] = { error: error.message, ...(name === "admin" && error.diagnostics ? { diagnostics: error.diagnostics } : {}) }
    }
  }
  report.status = Object.values(report.checks).some(value => value.error)
    ? "not-ready"
    : report.checks.mcp?.enabled === false
      ? "ready-mcp-disabled"
      : "client-verification-required"
  report.client =
    report.checks.mcp?.enabled === false
      ? "MCP is intentionally disabled; existing keys and connections are preserved."
      : "Verify tool discovery in the actual client; server checks alone do not certify its connection."
} catch (error) {
  report.error = error.message
}
console.log(JSON.stringify(report, null, 2))
if (report.status === "not-ready") process.exitCode = 1
