// Portable standalone upgrade acceptance harness. Run from the project root.
// No arguments: private artifact snapshot, checksum-pinned public baselines, all cases.
// Optional: --artifact DIR --baselines DIR --lane DIR --case CASE --offline
// All test data and reports are private; only owned fixture databases are used.
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { createHash } from "node:crypto"
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  writeFile,
  realpath,
  access,
  readdir,
} from "node:fs/promises"
import { createWriteStream } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import os from "node:os"
import { fileURLToPath, pathToFileURL } from "node:url"
import { fetchBaselines, snapshotArtifact } from "./prepare.mjs"
const arg = name => {
  const index = process.argv.indexOf(name)
  if (index < 0) return undefined
  assert(
    process.argv[index + 1] && !process.argv[index + 1].startsWith("--"),
    `Missing value for ${name}`
  )
  return process.argv[index + 1]
}
assert.match(process.version, /^v24\./, "Use pinned Node24 PATH")
const lane = arg("--lane")
  ? path.resolve(arg("--lane"))
  : await mkdtemp(path.join(os.tmpdir(), "smartsite-upgrade-"))
await mkdir(lane, { recursive: true, mode: 0o700 })
const artifact = arg("--artifact")
  ? await realpath(arg("--artifact"))
  : await snapshotArtifact(process.cwd(), path.join(lane, "artifact"))
const baselines = arg("--baselines")
  ? await realpath(arg("--baselines"))
  : await fetchBaselines(path.join(lane, "baselines"))
console.log(JSON.stringify({ fixtureLane: lane, artifact, baselines }))
if (!arg("--case")) {
  for (const fixture of ["clean-3.0.0", "clean-3.0.1", "custom-3.0.1"]) {
    const code = await new Promise((resolve, reject) => {
      const child = spawn(
        process.execPath,
        [
          fileURLToPath(import.meta.url),
          "--artifact",
          artifact,
          "--baselines",
          baselines,
          "--lane",
          lane,
          "--case",
          fixture,
          ...(process.argv.includes("--offline") ? ["--offline"] : []),
        ],
        { stdio: "inherit", env: process.env }
      )
      child.on("error", reject)
      child.on("close", resolve)
    })
    if (code !== 0) process.exit(code || 1)
  }
  process.exit(0)
}
const caseName = arg("--case")
assert(["clean-3.0.0", "clean-3.0.1", "custom-3.0.1"].includes(caseName))
const version = caseName.endsWith("3.0.0") ? "3.0.0" : "3.0.1",
  custom = caseName.startsWith("custom")
const baseline = path.join(baselines, `immutable-${version}`),
  site = path.join(lane, caseName)
const report = path.join(lane, caseName + "-reports"),
  requestFile = path.join(lane, caseName + "-request.private.json")
const own = path.dirname(fileURLToPath(import.meta.url)),
  evidence = path.join(lane, caseName + "-expected.json")
const logDir = path.join(lane, caseName + "-logs")
await mkdir(logDir, { recursive: true })
const resolutionsFile = path.join(lane, caseName + "-resolutions.json")
let applyResolutions = false
const hash = async file =>
  createHash("sha256")
    .update(await readFile(file))
    .digest("hex")
const binding = {
  schemaVersion: 1,
  caseName,
  artifact,
  baselines,
  lane: await realpath(lane),
  artifactManifest: await hash(path.join(artifact, "smartsite-export.json")),
  baselineManifest: await hash(path.join(baseline, "smartsite-export.json")),
  harness: await Promise.all(
    ["run.mjs", "data.mjs", "http.mjs", "prepare.mjs", "request-contract.mjs"].map(name =>
      hash(path.join(own, name))
    )
  ),
}
const bindingFile = path.join(logDir, "fixture-binding.json")
let previousBinding
try {
  previousBinding = JSON.parse(await readFile(bindingFile, "utf8"))
} catch (error) {
  if (error.code !== "ENOENT") throw error
}
if (previousBinding) {
  assert.deepEqual(previousBinding, binding, "Fixture inputs changed; use a fresh lane")
} else {
  assert.equal(
    (await readdir(logDir)).length,
    0,
    "Unbound existing fixture logs require a fresh lane"
  )
  await writeFile(bindingFile, JSON.stringify(binding, null, 2), {
    flag: "wx",
    mode: 0o600,
  })
}
async function command(
  name,
  exe,
  args,
  { fail = false, interrupt = false, reason } = {}
) {
  if (exe === "pnpm") {
    exe = path.join(path.dirname(process.execPath), "corepack")
    args = ["pnpm", ...args]
  }
  const out = createWriteStream(path.join(logDir, name + ".log"), { mode: 0o600 })
  const child = spawn(exe, args, {
    cwd: site,
    env: {
      ...process.env,
      PATH: path.dirname(process.execPath) + path.delimiter + process.env.PATH,
    },
    stdio: ["ignore", "pipe", "pipe"],
  })
  child.stdout.pipe(out, { end: false })
  child.stderr.pipe(out, { end: false })
  let killed = false,
    timer
  if (interrupt)
    timer = setInterval(async () => {
      try {
        const j = JSON.parse(await readFile(path.join(report, "source-journal.json")))
        if (j.completed.length >= 5 && !killed) {
          killed = true
          child.kill("SIGKILL")
        }
      } catch {}
    }, 2)
  const result = await new Promise((resolve, reject) => {
    child.on("error", reject)
    child.on("close", (code, signal) => resolve({ code, signal }))
  })
  clearInterval(timer)
  await new Promise(resolve => out.end(resolve))
  if (interrupt)
    assert(
      killed && result.signal === "SIGKILL",
      "Did not exercise a real interrupted source apply"
    )
  else if (fail) {
    assert.notEqual(result.code, 0, `${name} unexpectedly succeeded`)
    if (reason)
      assert.match(await readFile(path.join(logDir, name + ".log"), "utf8"), reason)
  } else if (result.code !== 0)
    throw new Error(
      `${name} failed (${result.code}); see ${path.join(logDir, name + ".log")}`
    )
  console.log(
    JSON.stringify({
      case: caseName,
      step: name,
      status: fail
        ? "refused-as-required"
        : interrupt
          ? "killed-after-checkpoint"
          : "passed",
    })
  )
}
const node = (name, args, options) => command(name, process.execPath, args, options)
const kit = (name, extra = [], options) =>
  node(
    name,
    [
      path.join(artifact, "scripts/upgrades/4.0.0", name.split("-")[0] + ".mjs"),
      "--request",
      requestFile,
      ...extra,
      ...(applyResolutions && name.startsWith("reconcile") && extra.includes("--apply")
        ? ["--resolutions", resolutionsFile]
        : []),
    ],
    options
  )
const helper = (name, phase) =>
  node(name, [
    "--import",
    path.join(site, "node_modules/tsx/dist/loader.mjs"),
    path.join(own, "data.mjs"),
    phase,
    evidence,
    ...(custom ? ["--custom"] : []),
  ])
async function step(name, fn) {
  const stamp = path.join(logDir, name + ".done")
  try {
    await access(stamp)
    return
  } catch {}
  await fn()
  await writeFile(stamp, "completed\n")
}
async function main() {
  try {
    await access(path.join(site, "package.json"))
  } catch {
    await cp(baseline, site, { recursive: true })
  }
  await step("request-contract", () =>
    node("request-contract", [path.join(own, "request-contract.mjs")])
  )
  await step("install-old", () =>
    command("install-old", "pnpm", [
      "--ignore-workspace",
      "install",
      ...(process.argv.includes("--offline") ? ["--offline"] : []),
      "--frozen-lockfile",
    ])
  )
  await step("bootstrap-old", () =>
    node("bootstrap-old", ["scripts/bootstrap-smartsite.mjs", "--prepare-only"])
  )
  if (custom)
    await step("customize", async () => {
      const file = path.join(site, "src/admin/payload/collections/pages.ts")
      let text = await readFile(file, "utf8")
      text = text.replace(
        "fields: [",
        'fields: [\n    { name: "clientNote", type: "text" },'
      )
      await writeFile(file, text)
      await writeFile(
        path.join(site, "src/client-feature.ts"),
        'export const clientFeature = "preserve-client-feature"\n'
      )
      const removed = path.join(site, "src/admin/config/defaults.ts")
      await writeFile(
        removed,
        "// Intentional fixture-only comment: requires explicit removed-file reconciliation.\n" +
          (await readFile(removed, "utf8"))
      )
    })
  await step("populate-http", () =>
    node("populate-http", [path.join(own, "http.mjs"), "populate", evidence])
  )
  await step("populate", () => helper("populate", "populate"))
  await step("request", async () => {
    const require = createRequire(path.join(site, "package.json"))
    let envText = await readFile(path.join(site, ".env"), "utf8"),
      env = require("dotenv").parse(envText)
    // The default upgrade needs no runner secret or automatic scheduler.
    envText = envText.replace(/^CRON_SECRET=.*(?:\r?\n|$)/gm, "")
    await writeFile(path.join(site, ".env"), envText, { mode: 0o600 })
    env = require("dotenv").parse(envText)
    const restore = new URL(env.DATABASE_URL)
    restore.pathname += "_review_restore"
    const restoreEnvironmentFile = path.join(lane, caseName + "-restore.env")
    await writeFile(restoreEnvironmentFile, `DATABASE_URL=${restore.href}\n`, {
      mode: 0o600,
    })
    await writeFile(
      requestFile,
      JSON.stringify(
        {
          schemaVersion: 1,
          siteRoot: await realpath(site),
          expectedSiteId: env.SMARTSITE_SITE_ID,
          sourceVersion: version,
          targetVersion: "4.0.2",
          oldBaselineDirectory: await realpath(baseline),
          targetArtifactDirectory: artifact,
          verifiedManifestPath: path.join(artifact, "smartsite-export.json"),
          environmentFile: path.join(await realpath(site), ".env"),
          reportDirectory: report,
          baselineManifestSha256: await hash(
            path.join(baseline, "smartsite-export.json")
          ),
          targetManifestSha256: await hash(path.join(artifact, "smartsite-export.json")),
          restoreEnvironmentFile,
          writesQuiesced: true,
          scheduledPublishing: {
            decision: "preserve-paused",
            reason:
              "Preserve existing future and overdue jobs for deliberate later opt-in",
          },
          allowedMediaHosts: [],
        },
        null,
        2
      ),
      { mode: 0o600 }
    )
    await command("git-init", "git", ["init"])
    await command("git-add", "git", ["add", "."])
    await command("git-baseline", "git", [
      "-c",
      "user.name=Standalone upgrade test",
      "-c",
      "user.email=fixture@example.invalid",
      "commit",
      "-m",
      "Standalone original baseline",
    ])
  })
  await step("unknown-setting-refusal", async () => {
    const file = path.join(site, "src/smartsite.config.ts")
    const original = await readFile(file, "utf8")
    assert(
      original.includes("export default config"),
      "Review the settings fixture export"
    )
    try {
      await writeFile(
        file,
        original.replace(
          "export default config",
          "export default { ...config, unsupportedFixtureOption: true }"
        )
      )
      await node(
        "unknown-setting-refusal",
        [
          "--import",
          path.join(site, "node_modules/tsx/dist/loader.mjs"),
          path.join(artifact, "scripts/upgrades/4.0.0/settings-inventory.mjs"),
          "--request",
          requestFile,
        ],
        { fail: true, reason: /Unmapped site settings[^\n]*unsupportedFixtureOption/ }
      )
    } finally {
      await writeFile(file, original)
    }
  })
  await step("native-schedule-decision-refusal", async () => {
    const alternate = {
      ...JSON.parse(await readFile(requestFile, "utf8")),
      reportDirectory: report + "-missing-schedule-decision",
    }
    delete alternate.scheduledPublishing
    const alternateFile = path.join(lane, caseName + "-missing-schedule-decision.json")
    await writeFile(alternateFile, JSON.stringify(alternate), { mode: 0o600 })
    await node(
      "native-schedule-decision-refusal",
      [
        path.join(artifact, "scripts/upgrades/4.0.0/inspect.mjs"),
        "--request",
        alternateFile,
      ],
      { fail: true, reason: /require a documented scheduledPublishing decision/ }
    )
  })
  await step("inspect", () => kit("inspect"))
  await step("unquiesced-source-refusal", async () => {
    const alternate = {
      ...JSON.parse(await readFile(requestFile, "utf8")),
      writesQuiesced: false,
      reportDirectory: report + "-unquiesced",
    }
    const alternateFile = path.join(lane, caseName + "-unquiesced.private.json")
    await writeFile(alternateFile, JSON.stringify(alternate), { mode: 0o600 })
    const scripts = path.join(artifact, "scripts/upgrades/4.0.0")
    await node("unquiesced-inspection", [
      path.join(scripts, "inspect.mjs"),
      "--request",
      alternateFile,
    ])
    const { sourceHashes, walkSource } = await import(
      pathToFileURL(path.join(scripts, "common.mjs")).href
    )
    const before = await sourceHashes(site, await walkSource(site))
    await node(
      "unquiesced-source-refusal",
      [path.join(scripts, "reconcile.mjs"), "--request", alternateFile, "--apply"],
      { fail: true, reason: /Stop old app\/workers and record writesQuiesced/ }
    )
    assert.deepEqual(
      await sourceHashes(site, await walkSource(site)),
      before,
      "Unquiesced refusal must not alter source"
    )
  })
  await step("backup", () => kit("backup"))
  await step("reconcile", () => kit("reconcile"))
  await step("restore-environment-tamper-refusal", async () => {
    const request = JSON.parse(await readFile(requestFile, "utf8")),
      original = await readFile(request.restoreEnvironmentFile)
    try {
      await writeFile(
        request.restoreEnvironmentFile,
        Buffer.concat([original, Buffer.from("# unexpected private environment edit\n")])
      )
      await kit("reconcile-restore-env-tamper", ["--apply"], {
        fail: true,
        reason: /Inspection fingerprint mismatch/,
      })
    } finally {
      await writeFile(request.restoreEnvironmentFile, original)
    }
  })
  await step("legacy-bson-proof-refusal", async () => {
    const file = path.join(report, "backup-proof.json")
    const original = await readFile(file)
    try {
      const proof = JSON.parse(original)
      proof.metadataEncoding = "canonical-ejson-v1"
      await writeFile(file, JSON.stringify(proof), { mode: 0o600 })
      await kit("reconcile-legacy-bson-proof", ["--apply"], {
        fail: true,
        reason: /BSON-preserving restored backup required/,
      })
    } finally {
      await writeFile(file, original)
    }
  })
  const reconciliation = JSON.parse(
    await readFile(path.join(report, "reconciliation.json"))
  )
  if (reconciliation.conflicts.length) {
    assert(
      custom &&
        reconciliation.conflicts.every(c => c.file === "src/admin/config/defaults.ts"),
      `Unexpected conflicts require manual review: ${JSON.stringify(reconciliation.conflicts)}`
    )
    await step("unresolved-source-refusal", () =>
      kit("reconcile-unresolved", ["--apply"], {
        fail: true,
        reason: /Unresolved customization/,
      })
    )
    await writeFile(
      resolutionsFile,
      JSON.stringify({
        "src/admin/config/defaults.ts": {
          action: "remove",
          reason:
            "Reviewed fixture customization is a comment only; no client behavior is removed. Native release owns the replacement defaults.",
        },
      })
    )
    applyResolutions = true
  }
  await step("tamper-refusal", async () => {
    const proof = JSON.parse(await readFile(path.join(report, "backup-proof.json"))),
      file = path.join(report, "backup", proof.files[0].path),
      bytes = await readFile(file)
    try {
      await writeFile(file, Buffer.concat([bytes, Buffer.from("\ncorrupt")]))
      await kit("reconcile-tamper", ["--apply"], {
        fail: true,
        reason: /Backup corruption/,
      })
    } finally {
      await writeFile(file, bytes)
    }
  })
  await step("conflict-refusal", async () => {
    const file = path.join(reconciliation.candidate, "src/site.config.ts"),
      bytes = await readFile(file)
    try {
      await writeFile(file, "<<<<<<< ours\nleft\n=======\nright\n>>>>>>> theirs\n")
      await kit("reconcile-conflict", ["--apply"], {
        fail: true,
        reason: /Conflict markers remain/,
      })
    } finally {
      await writeFile(file, bytes)
    }
  })
  await step("interrupted-apply", () =>
    kit("reconcile-interrupt", ["--apply"], { interrupt: true })
  )
  await step("resume-apply", () => kit("reconcile-resume", ["--apply"]))
  await step("install-new", () =>
    command("install-new", "pnpm", [
      "--ignore-workspace",
      "install",
      ...(process.argv.includes("--offline") ? ["--offline"] : []),
      "--frozen-lockfile",
    ])
  )
  if (custom)
    await step("startup-tripwire", async () => {
      const file = path.join(site, "src/payload.config.ts"),
        original = await readFile(file, "utf8")
      assert(
        original.includes("export default config"),
        "Fixture config export changed; review tripwire setup"
      )
      await writeFile(path.join(logDir, "native-config-before-tripwire.txt"), original)
      await writeFile(
        file,
        original.replace(
          "export default config",
          `export default config.then(resolved => {
  resolved.onInit = async () => { throw new Error("UPGRADE_STARTUP_TRIPWIRE_EXECUTED") }
  resolved.jobs.autoRun = () => { throw new Error("UPGRADE_AUTORUN_TRIPWIRE_EXECUTED") }
  return resolved
})`
        )
      )
    })
  if (custom)
    await step("paused-autorun-refusal", async () => {
      await kit("migrate-paused-autorun", [], {
        fail: true,
        reason:
          /Paused scheduled publications require reviewing and disabling native jobs.autoRun/,
      })
      const file = path.join(site, "src/payload.config.ts"),
        text = await readFile(file, "utf8")
      await writeFile(
        file,
        text.replace(
          'resolved.jobs.autoRun = () => { throw new Error("UPGRADE_AUTORUN_TRIPWIRE_EXECUTED") }',
          "resolved.jobs.autoRun = []"
        )
      )
    })
  await step("migrate-dry", () => kit("migrate-dry"))
  await step("migrate-apply", () => kit("migrate-apply", ["--apply"]))
  await step("verify", () => kit("verify"))
  await step("repeat-migrate", () => kit("migrate-repeat", ["--apply"]))
  await step("verify-repeat", () => kit("verify-repeat"))
  if (custom)
    await step("remove-startup-tripwire", async () => {
      await writeFile(
        path.join(site, "src/payload.config.ts"),
        await readFile(path.join(logDir, "native-config-before-tripwire.txt"))
      )
    })
  await step("runtime-new", () => helper("runtime-new", "check-new"))
  await step("http-new", () =>
    node("http-new", [path.join(own, "http.mjs"), "check", evidence])
  )
  await step("rollback-source", async () => {
    await command("rollback-git", "git", ["reset", "--hard", "HEAD"])
    await command("rollback-untracked", "git", ["clean", "-fd"])
    await command("rollback-install", "pnpm", [
      "--ignore-workspace",
      "install",
      ...(process.argv.includes("--offline") ? ["--offline"] : []),
      "--frozen-lockfile",
    ])
  })
  await step("runtime-rollback", () => helper("runtime-rollback", "check-rollback"))
  await step("http-rollback", () =>
    node("http-rollback", [path.join(own, "http.mjs"), "check-rollback", evidence])
  )
  await step("stop", () => node("stop", ["scripts/local/stop.mjs"]))
  await writeFile(
    path.join(lane, caseName + "-result.json"),
    JSON.stringify(
      {
        status: "passed",
        case: caseName,
        artifactManifestSha256: await hash(path.join(artifact, "smartsite-export.json")),
        baselineManifestSha256: await hash(path.join(baseline, "smartsite-export.json")),
        limitations: [
          "Production build acceptance is a separate stage; HTTP existing-key acceptance here uses the owned Next development runtime.",
        ],
      },
      null,
      2
    )
  )
}
await main().catch(async error => {
  console.error(error)
  try {
    await access(path.join(site, ".smartsite/local/state.json"))
    await node("failure-stop", ["scripts/local/stop.mjs"])
  } catch {}
  process.exitCode = 1
})
