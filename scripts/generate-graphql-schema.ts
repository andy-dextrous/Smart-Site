#!/usr/bin/env tsx
import "tsconfig-paths/register"
import { buildSchema, getIntrospectionQuery, graphql } from "graphql"
import { execFileSync } from "node:child_process"
import crypto from "node:crypto"
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import path from "node:path"

async function main() {
  const cwd = process.cwd()
  const payloadConfig = "src/admin/payload/payload.config.ts"

  /**
   * 1) Generate SDL via Payload CLI into CWD as schema.graphql
   */
  const bin = path.join(cwd, "node_modules", ".bin", "payload-graphql")
  // Potential SDL output locations from the CLI
  const sdlInCwd = path.join(cwd, "schema.graphql")
  const cfgDir = path.resolve(cwd, path.dirname(payloadConfig))
  const sdlByConfig = path.join(cfgDir, "graphql", "schema.graphql")
  const tempSDLs = [sdlInCwd, sdlByConfig]
  // Clean up any pre-existing files before generating
  for (const p of tempSDLs) {
    if (existsSync(p)) rmSync(p, { force: true })
  }

  console.log("Generating GraphQL SDL with Payload...")
  const registerModule = "tsconfig-paths/register.js"
  const nodeOptions = [
    process.env.NODE_OPTIONS,
    `--import=${registerModule}`,
    `--require ${registerModule}`,
  ]
    .filter(Boolean)
    .join(" ")
  execFileSync(bin, ["generate:schema"], {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_OPTIONS: nodeOptions,
      PAYLOAD_CONFIG_PATH: payloadConfig,
    },
    cwd,
  })

  let generatedPath = ""
  for (const p of tempSDLs) {
    if (existsSync(p)) {
      generatedPath = p
      break
    }
  }
  if (!generatedPath) {
    throw new Error("Payload did not generate schema.graphql (checked CWD and config-relative)")
  }

  const sdl = readFileSync(generatedPath, "utf-8")

  /**
   * 2) Compute introspection JSON from SDL
   */
  console.log("Building introspection JSON...")
  const schema = buildSchema(sdl)
  const introspection = await graphql({ schema, source: getIntrospectionQuery() })
  if (introspection.errors?.length) {
    console.error(introspection.errors)
    throw new Error("Failed to build introspection JSON from SDL")
  }

  /**
   * 3) Write outputs into public/.well-known/smartsite
   */
  const outDir = path.join(cwd, "public", ".well-known", "smartsite")
  mkdirSync(outDir, { recursive: true })

  const outSDL = path.join(outDir, "schema.graphql")
  const outJSON = path.join(outDir, "schema.json")
  writeFileSync(outSDL, sdl)
  /**
   * Write compact JSON to keep file size small
   */
  writeFileSync(outJSON, JSON.stringify(introspection.data))

  /**
   * 4) Write version file (sha256 of SDL)
   */
  const hash = crypto.createHash("sha256").update(sdl).digest("hex").substring(0, 12)
  const outVer = path.join(outDir, "schema.version")
  writeFileSync(outVer, hash)

  // Cleanup the generator’s temporary SDL files
  for (const p of tempSDLs) {
    if (existsSync(p)) rmSync(p, { force: true })
  }

  console.log(`GraphQL schema generated. Version: ${hash}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
