import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import {
  mkdir,
  readdir,
  readFile,
  writeFile,
  copyFile,
  realpath,
  lstat,
} from "node:fs/promises"
import path from "node:path"
import { spawnSync } from "node:child_process"

export const releases = {
  "3.0.0": {
    commit: "12bda446e0f5bc176464be7957f92d70c465af76",
    sha256: "6c4c8f45326f702fc851d841cdea9e0651282ba012f0df9633ccf7c1e65f82ad",
  },
  "3.0.1": {
    commit: "24ac40629464d34cf69f683bf488898d1dd44339",
    sha256: "9f03cfa5b99c5b56fdc28b54e2505a31176f33b39be9fa9372af77acf0844160",
  },
}
const digest = bytes => createHash("sha256").update(bytes).digest("hex")

export async function fetchBaselines(destination) {
  await mkdir(destination, { recursive: true, mode: 0o700 })
  assert.equal(
    (await readdir(destination)).length,
    0,
    "Automatic baseline destination must be empty"
  )
  for (const [version, release] of Object.entries(releases)) {
    const response = await fetch(
      `https://api.github.com/repos/andy-dextrous/Smart-Site/tarball/${release.commit}`,
      {
        headers: { "User-Agent": "smartsite-upgrade-regression" },
        signal: AbortSignal.timeout(120000),
      }
    )
    assert(response.ok, `Public ${version} archive download failed: ${response.status}`)
    const bytes = Buffer.from(await response.arrayBuffer())
    assert.equal(
      digest(bytes),
      release.sha256,
      `Immutable ${version} archive checksum differs; inspect the release rather than updating this checksum automatically`
    )
    const archive = path.join(destination, `${version}.tar.gz`),
      folder = path.join(destination, `immutable-${version}`)
    await writeFile(archive, bytes, { mode: 0o600 })
    await mkdir(folder, { mode: 0o700 })
    const unpack = spawnSync(
      "tar",
      ["-xzf", archive, "--strip-components=1", "-C", folder],
      { encoding: "utf8" }
    )
    if (unpack.error) throw unpack.error
    assert.equal(unpack.status, 0, `Archive extraction failed: ${unpack.stderr}`)
    const manifest = JSON.parse(
      await readFile(path.join(folder, "smartsite-export.json"), "utf8")
    )
    assert.equal(manifest.schemaVersion, 1)
    for (const item of manifest.files) {
      assert(
        !path.isAbsolute(item.path) && !item.path.split(/[\\/]/).includes(".."),
        "Unsafe baseline manifest entry"
      )
      const file = path.join(folder, item.path)
      assert((await lstat(file)).isFile(), "Baseline file must be regular")
      assert(
        (await realpath(file)).startsWith((await realpath(folder)) + path.sep),
        "Baseline escapes its directory"
      )
      assert.equal(
        digest(await readFile(file)),
        item.sha256,
        `Baseline file differs: ${item.path}`
      )
    }
    assert.equal(
      JSON.parse(await readFile(path.join(folder, "package.json"), "utf8")).version,
      version
    )
  }
  return realpath(destination)
}

export async function snapshotArtifact(source, destination) {
  const sourceRoot = await realpath(source)
  await mkdir(destination, { recursive: true, mode: 0o700 })
  const target = await realpath(destination)
  assert(
    !target.startsWith(sourceRoot + path.sep) && target !== sourceRoot,
    "Test artifact must be outside the source project"
  )
  assert.equal(
    (await readdir(target)).length,
    0,
    "Test artifact destination must be empty"
  )
  const skip = new Set([
    ".git",
    "node_modules",
    ".pnpm-store",
    ".next",
    ".turbo",
    ".mastra",
    ".smartsite",
    ".smartsite-self-hosted",
    ".smartsite-backup",
    ".smartsite-temp",
    ".vercel",
    "backups",
    "coverage",
    "test-results",
    "playwright-report",
    "tsconfig.tsbuildinfo",
    ".DS_Store",
    "smartsite-deployment.json",
    "smartsite-export.json",
  ])
  const files = []
  async function visit(relative = "") {
    for (const entry of await readdir(path.join(sourceRoot, relative), {
      withFileTypes: true,
    })) {
      const name = relative ? `${relative}/${entry.name}` : entry.name
      if (
        skip.has(entry.name) ||
        /\.(?:log|pem|key|archive|tgz)$/.test(entry.name) ||
        (entry.name.startsWith(".env") && !entry.name.endsWith(".example")) ||
        [
          ".npmrc",
          ".mcp.json",
          ".claude/settings.local.json",
          ".codex/config.toml",
          "public/media",
          "docs/exec-plans/active",
          "docs/exec-plans/completed",
        ].includes(name)
      )
        continue
      assert(!entry.isSymbolicLink(), `Test artifact refuses symlink: ${name}`)
      const to = path.join(target, name),
        from = path.join(sourceRoot, name)
      if (entry.isDirectory()) {
        await mkdir(to, { recursive: true })
        await visit(name)
      } else if (entry.isFile()) {
        await copyFile(from, to)
        files.push({ path: name, sha256: digest(await readFile(to)) })
      }
    }
  }
  await visit()
  assert.equal(
    JSON.parse(await readFile(path.join(target, "package.json"), "utf8")).version,
    "4.0.2"
  )
  await writeFile(
    path.join(target, "smartsite-export.json"),
    JSON.stringify(
      { schemaVersion: 1, files: files.sort((a, b) => a.path.localeCompare(b.path)) },
      null,
      2
    ) + "\n"
  )
  return target
}
