import assert from "node:assert/strict"
import { readdir, readFile, writeFile, mkdir, copyFile, rm } from "node:fs/promises"
import { spawn } from "node:child_process"
import { cleanEnvironment, loadState, local } from "../../scripts/local/state.mjs"
import { environment, stopProcess, startApp } from "../../scripts/local/runtime.mjs"

const files = await readdir(".")
assert.ok(
  !files.includes(".smartsite") &&
    !files.some(file => file.startsWith(".env") && !file.endsWith(".example")),
  "Preview fixture requires a clean standalone export"
)
const pagesPath = "src/collections/pages.ts"
const originalPages = await readFile(pagesPath, "utf8")
function run(args, env = cleanEnvironment()) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { env, stdio: "inherit" })
    child.on("error", reject)
    child.on("exit", code =>
      code === 0 ? resolve() : reject(new Error(`Preview fixture child failed: ${code}`))
    )
  })
}
try {
  assert.ok(originalPages.includes("read: authenticatedOrPublished,"))
  assert.ok(originalPages.includes('name: "sections",'))
  // Deliberate native restrictions exist only in this disposable test build.
  await writeFile(
    pagesPath,
    originalPages
      .replace(
        "read: authenticatedOrPublished,",
        'read: args => (args.req.user as any)?.username === "preview-denied" ? false : (args.req.user as any)?.username === "preview-parent-denied" ? { slug: { not_equals: "preview-parent" } } : authenticatedOrPublished(args),'
      )
      .replace(
        'name: "sections",',
        'name: "sections",\n              access: { read: ({ req }) => (req.user as any)?.username !== "preview-field-limited" },'
      )
      .replace(
        'name: "title",',
        'name: "title",\n      access: { read: ({ req }) => (req.user as any)?.username !== "preview-title-limited" },'
      )
  )
  await run(["scripts/bootstrap-smartsite.mjs", "--prepare-only"])
  const state = await loadState()
  const env = { ...(await environment(state)), NODE_ENV: "production" }
  await run(["node_modules/payload/bin.js", "generate:types"], env)
  await run(["node_modules/payload/bin.js", "generate:importmap"], env)
  await run(["--import", "tsx", "scripts/generate-sitemap-index.ts"], env)
  await run(["node_modules/next/dist/bin/next", "build"], env)
  await startApp(state, { mode: "production" })
  await run(["tests/routing/preview-http.mjs"], env)
  await run(["--import", "tsx", "tests/routing/preview-data.ts"], env)
} finally {
  await writeFile(pagesPath, originalPages)
  await mkdir("test-results", { recursive: true, mode: 0o700 })
  for (const name of ["provision.log", "app.log"])
    await copyFile(`${local}/${name}`, `test-results/preview-${name}`).catch(() => {})
  let stopped = false
  try {
    const state = await loadState()
    await stopProcess(state.appProcess)
    await stopProcess(state.databaseProcess)
    stopped = true
  } catch (error) {
    console.error("Inspect preview fixture cleanup:", error.message)
  }
  // The compiled artifact contains test access rules; never leave it deployable.
  await rm(".next", { recursive: true, force: true })
  if (stopped) {
    for (const file of [".env", ".mcp.json", ".codex/config.toml"])
      await rm(file, { force: true })
    await rm(".smartsite", { recursive: true, force: true })
  }
}
