import { access, readFile, stat } from "node:fs/promises"
import { constants } from "node:fs"
import { loadState, readJSON, local } from "./local/state.mjs"
import { inspectDatabase } from "./local/database.mjs"
import { health } from "./local/runtime.mjs"
import { mcpRequest } from "./local/clients.mjs"
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
    admin: async () => {
      const response = await fetch(`${report.url}/admin/login`, {
        signal: AbortSignal.timeout(30000),
      })
      if (!response.ok || !(await response.text()).includes("<html"))
        throw new Error("CMS login did not return an HTML page")
      return { responding: true, visualVerification: "required" }
    },
    media: async () => {
      const info = await stat("public/media")
      if (!info.isDirectory()) throw new Error("Local media path is not a directory")
      await access("public/media", constants.W_OK | constants.R_OK)
      return { readable: true, writable: true }
    },
    database: () => inspectDatabase(state, credentials),
    app: () => health(state),
    mcp: async () => {
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
      report.checks[name] = { error: error.message }
    }
  }
  report.status = Object.values(report.checks).some(value => value.error)
    ? "not-ready"
    : "client-verification-required"
  report.client =
    "Verify tool discovery in the actual client; server checks alone do not certify its connection."
} catch (error) {
  report.error = error.message
}
console.log(JSON.stringify(report, null, 2))
if (report.status === "not-ready") process.exitCode = 1
