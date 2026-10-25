import { mkdir, readFile, writeFile, copyFile, rm, rename } from "node:fs/promises"
import path from "node:path"
import { assertSchedulingDecision } from "./scheduled-publishing.mjs"
import { randomUUID } from "node:crypto"
import { spawnSync } from "node:child_process"
import {
  loadRequest,
  json,
  save,
  safePath,
  readOptional,
  digest,
  sourceHashes,
  walkSource,
  checkDestination,
  validateBackup,
} from "./common.mjs"
const context = await loadRequest()
const { request, fingerprint, baseline, target } = context
const reportFile = path.join(request.reportDirectory, "reconciliation.json")
const inspection = await json(path.join(request.reportDirectory, "inspection.json"))
assertSchedulingDecision(request, inspection.before.scheduledPublishing, context.env)
if (inspection.fingerprint !== fingerprint)
  throw new Error("Inspection fingerprint mismatch")
let candidate = path.join(request.reportDirectory, `source-candidate-${randomUUID()}`)
const map = (
  await json(
    path.join(request.targetArtifactDirectory, "docs/upgrades/4.0.0/file-map.json")
  )
).moves
const apply = process.argv.includes("--apply")
if (!apply) {
  if (
    JSON.stringify(
      await sourceHashes(request.siteRoot, Object.keys(inspection.hashes))
    ) !== JSON.stringify(inspection.hashes)
  )
    throw new Error("Source changed after inspection")
  await mkdir(candidate, { mode: 0o700 })
  for (const file of target.keys()) {
    const dest = safePath(candidate, file)
    await mkdir(path.dirname(dest), { recursive: true, mode: 0o700 })
    await copyFile(safePath(request.targetArtifactDirectory, file), dest)
  }
  const conflicts = [],
    preserved = []
  const aliases = Object.entries(map)
    .filter(([a, b]) => b && a.startsWith("src/") && b.startsWith("src/"))
    .map(([a, b]) => [
      "@/" + a.slice(4).replace(/\.(tsx?|jsx?)$/, ""),
      "@/" + b.slice(4).replace(/\.(tsx?|jsx?)$/, ""),
    ])
    .sort((a, b) => b[0].length - a[0].length)
  function transform(bytes) {
    let text = bytes.toString()
    for (const [from, to] of aliases)
      text = text.split(`"${from}"`).join(`"${to}"`).split(`'${from}'`).join(`'${to}'`)
    return text
  }
  for (const file of Object.keys(inspection.hashes)) {
    const ours = await readFile(safePath(request.siteRoot, file))
    const oldHash = baseline.get(file)
    if (oldHash === digest(ours)) continue
    const destination = Object.hasOwn(map, file)
      ? map[file]
      : target.has(file) || !oldHash
        ? file
        : null
    if (!destination) {
      const dest = safePath(candidate, file)
      await mkdir(path.dirname(dest), { recursive: true, mode: 0o700 })
      await writeFile(dest, ours)
      conflicts.push({
        file,
        destination: file,
        reason:
          "Customized source belongs to a removed configuration/module. Reconcile its behavior into the native files; do not discard it.",
      })
      continue
    }
    const dest = safePath(candidate, destination)
    await mkdir(path.dirname(dest), { recursive: true, mode: 0o700 })
    const theirs = await readOptional(
      safePath(request.targetArtifactDirectory, destination)
    )
    if (!oldHash && !theirs) {
      await writeFile(dest, /\.(tsx?|jsx?|mjs)$/.test(file) ? transform(ours) : ours)
      preserved.push(file)
      continue
    }
    if (!oldHash || !theirs || ours.includes(0) || theirs.includes(0)) {
      await writeFile(dest, ours)
      conflicts.push({
        file,
        destination,
        reason: "New-path collision or binary change requires source review",
      })
      continue
    }
    const base = await readFile(safePath(request.oldBaselineDirectory, file))
    const temp = path.join(request.reportDirectory, "merge-inputs")
    await mkdir(temp, { recursive: true, mode: 0o700 })
    const textSource = /\.(tsx?|jsx?|mjs)$/.test(file)
    const input = [
      textSource ? transform(ours) : ours,
      textSource ? transform(base) : base,
      theirs,
    ]
    const paths = ["ours", "base", "target"].map(name => path.join(temp, name))
    for (let i = 0; i < paths.length; i++)
      await writeFile(paths[i], input[i], { mode: 0o600 })
    const merged = spawnSync("git", ["merge-file", "-p", ...paths], {
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
    })
    if (merged.error || merged.status > 127 || merged.status === null)
      throw new Error(`Three-way merge failed: ${file}`)
    await writeFile(dest, merged.stdout)
    if (merged.status !== 0)
      conflicts.push({
        file,
        destination,
        reason:
          "Three-way merge conflict: preserve client behavior and review the resulting source",
      })
    else preserved.push(file)
  }
  // A client deletion must also survive or be explicitly reconciled.
  for (const file of baseline.keys()) {
    if (
      Object.hasOwn(inspection.hashes, file) ||
      file.startsWith(".env") ||
      file === "smartsite-export.json"
    )
      continue
    const destination = Object.hasOwn(map, file)
      ? map[file]
      : target.has(file)
        ? file
        : null
    if (destination)
      conflicts.push({
        file,
        destination,
        reason:
          "Client deleted a baseline file that the new release uses; explicitly resolve that deletion",
      })
  }
  const report = {
    schemaVersion: 1,
    fingerprint,
    candidate,
    conflicts,
    preserved,
    status: conflicts.length ? "conflicts-require-review" : "ready-for-source-review",
  }
  await save(reportFile, report)
  console.log(JSON.stringify(report))
} else {
  if (request.writesQuiesced !== true)
    throw new Error(
      "Stop old app/workers and record writesQuiesced before applying source"
    )
  const report = await json(reportFile)
  candidate = report.candidate
  if (!candidate.startsWith(request.reportDirectory + path.sep + "source-candidate-"))
    throw new Error("Candidate path mismatch")
  const proof = await json(path.join(request.reportDirectory, "backup-proof.json"))
  if (
    report.fingerprint !== fingerprint ||
    proof.fingerprint !== fingerprint ||
    !proof.restored
  )
    throw new Error("Matching inspection and restored-backup proof required")
  await validateBackup(context, proof)
  const flag = process.argv.indexOf("--resolutions")
  const resolutions = flag < 0 ? {} : await json(process.argv[flag + 1])
  for (const conflict of report.conflicts) {
    const resolution = resolutions[conflict.file]
    if (
      !resolution ||
      !["merge", "keep", "replace", "remove"].includes(resolution.action) ||
      !resolution.reason?.trim()
    )
      throw new Error(`Unresolved customization: ${conflict.file}`)
  }
  for (const conflict of report.conflicts) {
    const action = resolutions[conflict.file].action
    const dest = safePath(candidate, conflict.destination)
    if (action === "remove") await rm(dest, { force: true })
    if (action === "keep")
      await copyFile(
        safePath(path.join(request.reportDirectory, "backup/source"), conflict.file),
        dest
      )
    if (action === "replace")
      await copyFile(
        safePath(request.targetArtifactDirectory, conflict.destination),
        dest
      )
    if (action === "merge" && !(await readOptional(dest)))
      throw new Error(`Merged file missing: ${conflict.destination}`)
  }
  const files = await walkSource(candidate)
  for (const file of files) {
    const bytes = await readFile(safePath(candidate, file))
    if (/^(<<<<<<< |=======\r?$|>>>>>>> )/m.test(bytes.toString()))
      throw new Error(`Conflict markers remain: ${file}`)
  }
  const desired = await sourceHashes(candidate, files)
  const journalFile = path.join(request.reportDirectory, "source-journal.json")
  const existing = await readOptional(journalFile)
  const resolutionsHash = digest(JSON.stringify(resolutions))
  const journal = existing
    ? JSON.parse(existing)
    : { fingerprint, desired, resolutionsHash, completed: [] }
  if (
    journal.fingerprint !== fingerprint ||
    journal.resolutionsHash !== resolutionsHash ||
    JSON.stringify(journal.desired) !== JSON.stringify(desired)
  )
    throw new Error(
      "Candidate changed during source apply; restore/reconcile deliberately"
    )
  await save(journalFile, journal)
  const names = [...new Set([...Object.keys(inspection.hashes), ...files])].sort()
  for (const file of names) {
    const destination = await checkDestination(request.siteRoot, file)
    const current = await readOptional(destination)
    const currentHash = current === null ? null : digest(current)
    const expected = desired[file] ?? null
    if (currentHash === expected) continue
    if (currentHash !== (inspection.hashes[file] ?? null))
      throw new Error(`Concurrent source edit preserved; apply stopped: ${file}`)
    if (expected === null) await rm(destination)
    else {
      await mkdir(path.dirname(destination), { recursive: true })
      const temporary = `${destination}.${randomUUID()}.upgrade-tmp`
      await copyFile(safePath(candidate, file), temporary)
      await checkDestination(request.siteRoot, file)
      await rename(temporary, destination)
    }
    journal.completed.push(file)
    await save(journalFile, journal)
  }
  await save(reportFile, {
    ...report,
    resolutions,
    status: "source-applied",
    appliedHashes: desired,
  })
  console.log(
    JSON.stringify({
      status: "source-applied",
      files: files.length,
      next: "Reconcile the lockfile if needed, install frozen, generate types/import map, then run migrate without --apply",
    })
  )
}
