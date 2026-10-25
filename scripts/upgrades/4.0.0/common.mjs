import {
  readFile,
  writeFile,
  mkdir,
  realpath,
  lstat,
  readdir,
  rename,
} from "node:fs/promises"
import path from "node:path"
import { createRequire } from "node:module"
import { createHash, randomUUID } from "node:crypto"
import { execFileSync } from "node:child_process"
export const digest = value => createHash("sha256").update(value).digest("hex")
export const json = async file => JSON.parse(await readFile(file, "utf8"))
export async function save(file, value) {
  await mkdir(path.dirname(file), { recursive: true, mode: 0o700 })
  const temporary = `${file}.${randomUUID()}.tmp`
  await writeFile(temporary, JSON.stringify(value, null, 2) + "\n", { mode: 0o600 })
  await rename(temporary, file)
}
export function safePath(root, name) {
  if (
    typeof name !== "string" ||
    path.isAbsolute(name) ||
    name.split(/[\\/]/).includes("..")
  )
    throw new Error("Unsafe manifest path")
  return path.join(root, name)
}
export async function readOptional(file) {
  try {
    return await readFile(file)
  } catch (e) {
    if (e.code === "ENOENT") return null
    throw e
  }
}
export function parseEnvironment(text) {
  const values = {}
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!match) continue
    let value = match[2].trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    )
      value = value.slice(1, -1)
    else value = value.replace(/\s+#.*$/, "")
    values[match[1]] = value
  }
  return values
}
export async function verifyManifest(root, manifestPath, expectedHash) {
  const bytes = await readFile(manifestPath)
  if (!expectedHash || digest(bytes) !== expectedHash)
    throw new Error(
      "Artifact manifest checksum mismatch; verify against the release before proceeding"
    )
  const manifest = JSON.parse(bytes)
  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.files))
    throw new Error("Unsupported manifest")
  const entries = new Map()
  for (const item of manifest.files) {
    const file = safePath(root, item.path)
    if (entries.has(item.path) || !(await lstat(file)).isFile())
      throw new Error("Duplicate/non-file artifact entry")
    // realpath also detects a symlinked ancestor escaping the artifact.
    const actual = await realpath(file)
    if (
      !actual.startsWith(root + path.sep) ||
      digest(await readFile(file)) !== item.sha256
    )
      throw new Error(`Artifact file mismatch: ${item.path}`)
    entries.set(item.path, item.sha256)
  }
  return entries
}
export async function loadRequest() {
  const flag = process.argv.indexOf("--request")
  if (flag < 0 || !process.argv[flag + 1])
    throw new Error("Usage: --request /absolute/private/request.json")
  const requestFile = await realpath(process.argv[flag + 1])
  const requestBytes = await readFile(requestFile)
  let request
  try {
    request = JSON.parse(requestBytes)
  } catch {
    throw new Error("Invalid upgrade request JSON; inspect it privately")
  }
  if (Object.hasOwn(request, "restoreDatabaseURL"))
    throw new Error(
      "Inline restoreDatabaseURL is no longer supported; put DATABASE_URL in a private restore environment file and use restoreEnvironmentFile, then create fresh inspection reports"
    )
  if (
    request.schemaVersion !== 1 ||
    !["3.0.0", "3.0.1"].includes(request.sourceVersion) ||
    request.targetVersion !== "4.0.1" ||
    !request.expectedSiteId
  )
    throw new Error("Unsupported source/target version or missing site identity")
  for (const key of [
    "siteRoot",
    "oldBaselineDirectory",
    "targetArtifactDirectory",
    "verifiedManifestPath",
    "environmentFile",
    "restoreEnvironmentFile",
    "reportDirectory",
  ]) {
    if (!path.isAbsolute(request[key] || "")) throw new Error(`${key} must be absolute`)
  }
  for (const key of [
    "siteRoot",
    "oldBaselineDirectory",
    "targetArtifactDirectory",
    "environmentFile",
    "restoreEnvironmentFile",
  ])
    request[key] = await realpath(request[key])
  const restoreStat = await lstat(request.restoreEnvironmentFile)
  if (
    !restoreStat.isFile() ||
    restoreStat.mode & 0o077 ||
    (typeof process.getuid === "function" && restoreStat.uid !== process.getuid())
  )
    throw new Error(
      "restoreEnvironmentFile must be a regular owner-private file (mode0600)"
    )
  const restoreBytes = await readFile(request.restoreEnvironmentFile)
  const restoreEnv = parseEnvironment(restoreBytes.toString())
  let ConnectionString
  try {
    const siteRequire = createRequire(path.join(request.siteRoot, "package.json"))
    const driverRequire = createRequire(siteRequire.resolve("mongodb"))
    ConnectionString = driverRequire("mongodb-connection-string-url").default
  } catch {
    throw new Error("Install the existing site's MongoDB dependencies before inspecting an upgrade request")
  }
  try {
    const url = new ConnectionString(restoreEnv.DATABASE_URL)
    if (
      !["mongodb:", "mongodb+srv:"].includes(url.protocol) ||
      !url.hosts.length ||
      url.pathname.length < 2
    )
      throw new Error("invalid")
  } catch {
    throw new Error(
      "restoreEnvironmentFile must privately define a valid Mongo DATABASE_URL with an explicit database name"
    )
  }
  await mkdir(request.reportDirectory, { recursive: true, mode: 0o700 })
  request.reportDirectory = await realpath(request.reportDirectory)
  const roots = [
    request.siteRoot,
    request.oldBaselineDirectory,
    request.targetArtifactDirectory,
    request.reportDirectory,
  ]
  if (
    roots.some((root, i) =>
      roots.some(
        (other, j) => i !== j && (root === other || root.startsWith(other + path.sep))
      )
    )
  )
    throw new Error(
      "Site, immutable artifacts and private reports must use separate non-nested directories"
    )
  const envBytes = await readFile(request.environmentFile)
  const env = parseEnvironment(envBytes.toString())
  if (
    env.SMARTSITE_SITE_ID !== request.expectedSiteId ||
    !env.DATABASE_URL ||
    !env.PAYLOAD_SECRET
  )
    throw new Error("Environment identity or required credentials mismatch")
  if (!["local", "preview", "production"].includes(env.SMARTSITE_ENVIRONMENT))
    throw new Error(
      "An explicit local, preview or production environment is required before inspection"
    )
  if (env.DATABASE_PROVIDER !== "mongoose")
    throw new Error(
      "Automatic 4.0 data migration supports Mongo only; PostgreSQL requires a separately reviewed database migration"
    )
  if (env.SMARTSITE_DATABASE_TARGET && env.SMARTSITE_DATABASE_TARGET !== "default")
    throw new Error(
      "Use an explicit default database URL; implicit staging/production selectors are refused"
    )
  const baselineManifest = path.join(
    request.oldBaselineDirectory,
    "smartsite-export.json"
  )
  const baseline = await verifyManifest(
    request.oldBaselineDirectory,
    baselineManifest,
    request.baselineManifestSha256
  )
  const target = await verifyManifest(
    request.targetArtifactDirectory,
    request.verifiedManifestPath,
    request.targetManifestSha256
  )
  if (
    (await json(path.join(request.oldBaselineDirectory, "package.json"))).version !==
      request.sourceVersion ||
    (await json(path.join(request.targetArtifactDirectory, "package.json"))).version !==
      request.targetVersion
  )
    throw new Error("Artifact package version mismatch")
  return {
    request,
    env,
    restoreEnv,
    baseline,
    target,
    fingerprint: digest(
      JSON.stringify([
        requestBytes.toString("base64"),
        envBytes.toString("base64"),
        request.restoreEnvironmentFile,
        restoreBytes.toString("base64"),
        roots,
      ])
    ),
    requestFile,
  }
}
export async function sourceHashes(root, paths) {
  const result = {}
  for (const name of [...paths].sort()) {
    const bytes = await readOptional(safePath(root, name))
    result[name] = bytes === null ? null : digest(bytes)
  }
  return result
}
export function requireCleanGit(root) {
  const status = execFileSync(
    "git",
    ["status", "--porcelain", "--untracked-files=normal"],
    { cwd: root, encoding: "utf8" }
  )
  if (status.trim())
    throw new Error(
      "Save existing source changes in Git before inspecting an upgrade; unrelated dirty files are not overwritten"
    )
  return execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: root,
    encoding: "utf8",
  }).trim()
}
export async function walkSource(root, relative = "") {
  const skip = new Set([
    ".git",
    "node_modules",
    ".next",
    ".smartsite",
    ".smartsite-self-hosted",
    ".vercel",
    "test-results",
    "coverage",
  ])
  const files = []
  for (const entry of await readdir(safePath(root, relative), { withFileTypes: true })) {
    const name = relative ? `${relative}/${entry.name}` : entry.name
    if (
      skip.has(entry.name) ||
      (entry.name.startsWith(".env") && !entry.name.endsWith(".example")) ||
      ["tsconfig.tsbuildinfo", "smartsite-export.json"].includes(name) ||
      name === "public/media"
    )
      continue
    if (entry.isSymbolicLink())
      throw new Error(`Source symlink needs manual reconciliation: ${name}`)
    if (entry.isDirectory()) files.push(...(await walkSource(root, name)))
    else if (entry.isFile()) files.push(name)
  }
  return files
}

export async function checkDestination(root, name) {
  const destination = safePath(root, name)
  let cursor = root
  for (const part of name.split("/")) {
    cursor = path.join(cursor, part)
    const stat = await lstat(cursor).catch(error => {
      if (error.code === "ENOENT") return null
      throw error
    })
    if (stat?.isSymbolicLink())
      throw new Error(`Symlink appeared during source migration: ${name}`)
  }
  return destination
}
export async function validateBackup(context, proof) {
  if (proof.metadataEncoding !== "canonical-ejson-v2")
    throw new Error(
      "BSON-preserving restored backup required; recreate legacy backup proof"
    )
  if (proof.fingerprint !== context.fingerprint || !proof.restored)
    throw new Error("Matching restored backup is required")
  const root = path.join(context.request.reportDirectory, "backup")
  for (const item of [
    ...proof.files,
    ...proof.media.map(item => ({ ...item, path: `media/${item.path}` })),
    ...(proof.hostedMedia || []),
  ]) {
    if (digest(await readFile(safePath(root, item.path))) !== item.sha256)
      throw new Error(`Backup corruption: ${item.path}`)
  }
  const inspection = await json(
    path.join(context.request.reportDirectory, "inspection.json")
  )
  if (
    JSON.stringify(
      await sourceHashes(path.join(root, "source"), Object.keys(inspection.hashes))
    ) !== JSON.stringify(inspection.hashes)
  )
    throw new Error("Source backup is missing or corrupt")
  if (
    digest(await readFile(path.join(root, "environment.private"))) !==
    digest(await readFile(context.request.environmentFile))
  )
    throw new Error("Environment backup mismatch")
}
