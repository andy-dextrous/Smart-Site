import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { root, atomicJSON } from "./state.mjs"
const quote = s => `'${s.replaceAll("'", "'\\''")}'`
export async function configureClients(state) {
  const helper = `${quote(process.execPath)} ${quote(path.join(root, "scripts/local/headers.mjs"))}`
  const url = `http://127.0.0.1:${state.appPort}/api/mcp`
  let claude = { mcpServers: {} }
  try {
    claude = JSON.parse(await readFile(path.join(root, ".mcp.json"), "utf8"))
  } catch (error) {
    if (error.code !== "ENOENT") throw error
  }
  claude.mcpServers ??= {}
  if (claude.mcpServers.smartsite && claude.mcpServers.smartsite.url !== url)
    throw new Error(
      "Existing SmartSite MCP connection targets another site; review before replacing it"
    )
  claude.mcpServers.smartsite = { type: "http", url, headersHelper: helper }
  await atomicJSON(path.join(root, ".mcp.json"), claude)
  await mkdir(path.join(root, ".codex"), { recursive: true })
  const configFile = path.join(root, ".codex/config.toml")
  let codex = ""
  try {
    codex = await readFile(configFile, "utf8")
  } catch (error) {
    if (error.code !== "ENOENT") throw error
  }
  const begin = "# BEGIN SMARTSITE LOCAL",
    end = "# END SMARTSITE LOCAL"
  if (codex.includes(begin))
    codex =
      codex.slice(0, codex.indexOf(begin)) + codex.slice(codex.indexOf(end) + end.length)
  if (/\[mcp_servers\.smartsite\]/.test(codex))
    throw new Error("An unmanaged SmartSite MCP entry exists. Reconcile it before setup.")
  codex += `\n${begin}\n[mcp_servers.smartsite]\nurl = ${JSON.stringify(url)}\nhttp_headers_helper = ${JSON.stringify(helper)}\nstartup_timeout_sec = 60\ntool_timeout_sec = 120\n${end}\n`
  await writeFile(configFile, codex, { mode: 0o600 })
}
export async function mcpRequest(state, credentials, method, params = {}) {
  const response = await fetch(`http://127.0.0.1:${state.appPort}/api/mcp`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${credentials.mcpKey}`,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(60000),
  })
  const text = await response.text()
  if (!response.ok) throw new Error(`MCP request rejected (${response.status})`)
  const json =
    text.startsWith("data:") || text.includes("\ndata:")
      ? JSON.parse(
          text
            .split("\n")
            .find(line => line.startsWith("data:"))
            .slice(5)
        )
      : JSON.parse(text)
  if (json.error || json.result?.isError)
    throw new Error("MCP request failed; inspect the private server log")
  return json.result
}
