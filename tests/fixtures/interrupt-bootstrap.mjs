// Test-only crash injection after a durable checkpoint. Never imported by the app.
import fs from "node:fs/promises"
import { syncBuiltinESMExports } from "node:module"
const rename = fs.rename
fs.rename = async (from, to) => {
  await rename(from, to)
  if (!String(to).endsWith("/.smartsite/local/state.json")) return
  const state = JSON.parse(await fs.readFile(to, "utf8"))
  const wanted = process.env.SMARTSITE_TEST_INTERRUPT_STAGE
  const stage = state.serverMcpVerified
    ? "server-mcp-verified"
    : state.stage === "prerequisites-ready" && state.databaseProcess
      ? "database-process-recorded"
      : state.stage === "essentials-ready" && state.appProcess
        ? "app-process-recorded"
        : state.stage
  if (stage === wanted) process.exit(19)
}
syncBuiltinESMExports()
