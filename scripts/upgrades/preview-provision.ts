import { readFile, access } from "node:fs/promises"
import { getPayload } from "payload"
import path from "node:path"
import { pathToFileURL } from "node:url"
const state = JSON.parse(await readFile(".smartsite/local/state.json", "utf8"))
const credentials = JSON.parse(await readFile(".smartsite/local/credentials.json", "utf8"))
if (state.purpose !== "upgrade-preview" || state.siteId !== process.env.SMARTSITE_SITE_ID || process.env.SMARTSITE_ENVIRONMENT !== "local") throw new Error("Preview identity required")
const native = path.resolve("src/payload.config.ts")
let configFile = native
try { await access(native) } catch (error: any) { if (error.code !== "ENOENT") throw error; configFile = path.resolve("src/admin/payload/payload.config.ts") }
const resolved = await (await import(pathToFileURL(configFile).href)).default
resolved.onInit = undefined
resolved.jobs = { ...resolved.jobs, autoRun: [] }
const payload = await getPayload({ config: resolved })
try {
  await Promise.all(Object.values((payload.db as any).collections ?? {}).map((model: any) => model.init()))
  const identity = await payload.find({ collection: "smartsite-identity" as any, limit: 2 })
  if (identity.docs.length !== 1 || (identity.docs[0] as any).siteId !== state.siteId) throw new Error("Restored preview identity mismatch")
  const existing = await payload.find({ collection: "users", where: { email: { equals: state.email } }, limit: 1 })
  if (existing.docs.length) throw new Error("Preview operator already exists; inspect the partial restoration")
  const user = await payload.create({ collection: "users", data: { email: state.email, username: "preview-owner", name: "Preview", lastName: "Owner", password: credentials.adminPassword, role: "developer" } })
  if (payload.config.endpoints.some(endpoint => endpoint.path === "/mcp" && endpoint.method === "post")) await payload.create({ collection: "payload-mcp-api-keys" as any, data: { label: `local-${state.siteId}`, user: user.id, enableAPIKey: true, apiKey: credentials.mcpKey, "payload-mcp-tool": { smartsiteRead: true, smartsiteSave: true, smartsiteUploadMedia: true, smartsiteOperationStatus: true } } })
} finally { await payload.destroy() }
