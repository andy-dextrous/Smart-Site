import path from "node:path"
import { pathToFileURL } from "node:url"
import { loadRequest, json, save } from "./common.mjs"
const { request, fingerprint, env } = await loadRequest()
// Only the authored configuration module is loaded; do not initialize Payload.
Object.assign(process.env, env)
const { default: settings } = await import(pathToFileURL(path.join(request.siteRoot, "src/smartsite.config.ts")).href)
const map = await json(new URL("../../../docs/upgrades/4.0.0/settings-map.json", import.meta.url))
const paths = []
function visit(value, key = "") {
  if (value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length) {
    for (const [name, child] of Object.entries(value)) visit(child, key ? `${key}.${name}` : name)
  } else paths.push(key)
}
visit(settings)
const matches = (pattern, key) => {
  const a = pattern.split("."), b = key.split(".")
  return a.every((part, index) => part === "**" || (part === "*" && b[index] !== undefined) || part === b[index]) && (a.at(-1) === "**" || a.length === b.length)
}
const mapped = paths.map(key => ({ key, owner: map.find(entry => matches(entry.old, key))?.owner }))
const unmapped = mapped.filter(entry => !entry.owner).map(entry => entry.key)
await save(path.join(request.reportDirectory, "settings-inventory.json"), { fingerprint, mapped, unmapped })
if (unmapped.length) throw new Error(`Unmapped site settings require an explicit reviewed migration: ${unmapped.join(", ")}`)
console.log(JSON.stringify({ mappedSettings: mapped.length }))
