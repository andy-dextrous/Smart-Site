import assert from "node:assert/strict"
import { readdir, readFile, writeFile, mkdir, copyFile, rm } from "node:fs/promises"
import { spawn } from "node:child_process"
import { cleanEnvironment, loadState, local } from "../../scripts/local/state.mjs"
import { environment, stopProcess } from "../../scripts/local/runtime.mjs"
const files = await readdir(".")
if (
  files.includes(".smartsite") ||
  files.some(file => file.startsWith(".env") && !file.endsWith(".example"))
)
  throw new Error("Native configuration fixture requires a clean standalone export")
const original = await readFile("src/payload.config.ts", "utf8")
const presentation = await readFile("src/site.config.ts", "utf8")
const generated = await Promise.all(
  ["src/payload-types.ts", "src/app/(payload)/admin/importMap.js"].map(async file => [
    file,
    await readFile(file),
  ])
)
function replace(source, from, to) {
  assert.ok(source.includes(from), `Fixture insertion point missing: ${from}`)
  return source.replace(from, to)
}
function run(args, env = cleanEnvironment()) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { env, stdio: "inherit" })
    child.once("error", reject)
    child.once("exit", code =>
      code === 0
        ? resolve()
        : reject(new Error(`Native configuration fixture failed: ${code}`))
    )
  })
}
try {
  if (original.includes('from "@payloadcms/storage-vercel-blob"')) {
    const hostedEnv = cleanEnvironment({
      DATABASE_PROVIDER: "mongoose",
      DATABASE_URL: "mongodb://127.0.0.1:1/native_configuration_no_connection",
      PAYLOAD_SECRET: "native-configuration-import-only",
      SMARTSITE_ENVIRONMENT: "production",
      NEXT_PUBLIC_URL: "https://example.test",
    })
    delete hostedEnv.BLOB_READ_WRITE_TOKEN
    delete hostedEnv.VERCEL_BLOB_TOKEN
    await run(
      [
        "--import",
        "tsx",
        "tests/fixtures/native-configuration/hosted-blob.ts",
        "--missing",
      ],
      hostedEnv
    )
    await run(["--import", "tsx", "tests/fixtures/native-configuration/hosted-blob.ts"], {
      ...hostedEnv,
      VERCEL_BLOB_TOKEN: "vercel_blob_rw_fixturestore_fixturetoken",
    })
  }
  let config =
    'import { NativeProjects, PrivateNative, NativeGlobal, NativeLinkBlock } from "../tests/fixtures/native-configuration/config"\n' +
    original
  config = replace(
    config,
    "const collections = [",
    "const collections = [NativeProjects, PrivateNative,"
  )
  config = replace(
    config,
    "blocks: [FormBlock, MediaBlock]",
    "blocks: [FormBlock, MediaBlock, NativeLinkBlock]"
  )
  config = replace(
    config,
    "globals: [Header, Footer, createSettings(inventory)]",
    "globals: [Header, Footer, createSettings(inventory), NativeGlobal]"
  )
  config = replace(
    config,
    "const config = buildConfig({",
    'const config = buildConfig({ localization: { locales: ["en", "fr"], defaultLocale: "en", fallback: true },'
  )
  await writeFile("src/payload.config.ts", config)
  await writeFile(
    "src/site.config.ts",
    replace(
      presentation,
      "search: {\n      enabled: true",
      "search: {\n      enabled: false"
    )
  )
  await run(["scripts/bootstrap-smartsite.mjs", "--prepare-only"])
  const state = await loadState()
  await run(
    ["--import", "tsx", "tests/fixtures/native-configuration/check.ts"],
    await environment(state)
  )
  await run(["node_modules/typescript/bin/tsc", "--noEmit"], await environment(state))
} finally {
  await writeFile("src/payload.config.ts", original)
  await writeFile("src/site.config.ts", presentation)
  for (const [file, contents] of generated) await writeFile(file, contents)
  await mkdir("test-results", { recursive: true })
  await copyFile(
    `${local}/provision.log`,
    "test-results/native-configuration-provision.log"
  ).catch(() => {})
  let stopped = false
  try {
    const state = await loadState()
    await stopProcess(state.appProcess)
    await stopProcess(state.databaseProcess)
    stopped = true
  } catch (error) {
    console.error("Inspect fixture cleanup:", error.message)
  }
  if (stopped)
    for (const file of [".env", ".smartsite", ".mcp.json", ".codex/config.toml"])
      await rm(file, { recursive: true, force: true })
}
