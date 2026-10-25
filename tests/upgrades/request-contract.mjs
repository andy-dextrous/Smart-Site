// Pure request/config regression: no database, server or provider connection.
import assert from "node:assert/strict"
import { mkdtemp, mkdir, writeFile, chmod, rm, symlink } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import os from "node:os"
import { loadRequest, digest } from "../../scripts/upgrades/4.0.0/common.mjs"
import {
  scheduledJobSummary,
  assertSchedulingDecision,
  assertSchedulingConfiguration,
} from "../../scripts/upgrades/4.0.0/scheduled-publishing.mjs"
const root = await mkdtemp(path.join(os.tmpdir(), "smartsite-upgrade-contract-"))
const previousArgv = process.argv
try {
  for (const folder of ["site", "baseline", "target"])
    await mkdir(path.join(root, folder))
  // The tested standalone site uses this test project's installed Mongo parser;
  // no database connection is opened and no dependency state is copied or altered.
  await symlink(
    fileURLToPath(new URL("../../node_modules", import.meta.url)),
    path.join(root, "site/node_modules"),
    "junction"
  )
  const manifests = {}
  for (const [folder, version] of [
    ["baseline", "3.0.1"],
    ["target", "4.0.1"],
  ]) {
    const bytes = JSON.stringify({ version })
    await writeFile(path.join(root, folder, "package.json"), bytes)
    const manifest = JSON.stringify({
      schemaVersion: 1,
      files: [{ path: "package.json", sha256: digest(bytes) }],
    })
    await writeFile(path.join(root, folder, "smartsite-export.json"), manifest)
    manifests[folder] = digest(manifest)
  }
  const envFile = path.join(root, "source.env"),
    restoreEnvironmentFile = path.join(root, "restore.env")
  await writeFile(
    envFile,
    "DATABASE_PROVIDER=mongoose\nDATABASE_URL=mongodb://fixture:private@127.0.0.1/source\nPAYLOAD_SECRET=private-fixture\nSMARTSITE_SITE_ID=fixture\nSMARTSITE_ENVIRONMENT=local\n",
    { mode: 0o600 }
  )
  const restoreBytes =
    "DATABASE_URL=mongodb://fixture:restore-private@127.0.0.1/restore\n"
  await writeFile(restoreEnvironmentFile, restoreBytes, { mode: 0o600 })
  const request = {
    schemaVersion: 1,
    siteRoot: path.join(root, "site"),
    oldBaselineDirectory: path.join(root, "baseline"),
    targetArtifactDirectory: path.join(root, "target"),
    verifiedManifestPath: path.join(root, "target/smartsite-export.json"),
    environmentFile: envFile,
    restoreEnvironmentFile,
    reportDirectory: path.join(root, "reports"),
    sourceVersion: "3.0.1",
    targetVersion: "4.0.1",
    expectedSiteId: "fixture",
    baselineManifestSha256: manifests.baseline,
    targetManifestSha256: manifests.target,
  }
  const requestFile = path.join(root, "request.json")
  const put = value => writeFile(requestFile, JSON.stringify(value), { mode: 0o600 })
  await put(request)
  process.argv = [...previousArgv, "--request", requestFile]
  const initial = await loadRequest()
  // The package target advances independently of the unchanged 4.0 migration epoch.
  for (const targetVersion of ["4.0.0", "4.0.2"]) {
    await put({ ...request, targetVersion })
    await assert.rejects(loadRequest, /Unsupported source\/target version/)
  }
  await put({ ...request, sourceVersion: "4.0.0" })
  await assert.rejects(loadRequest, /Unsupported source\/target version/)
  await put(request)
  const targetPackage = path.join(root, "target/package.json")
  await writeFile(targetPackage, JSON.stringify({ version: "4.0.0" }))
  await assert.rejects(loadRequest, /Artifact file mismatch/)
  const targetManifest = path.join(root, "target/smartsite-export.json")
  const staleTargetManifest = JSON.stringify({
    schemaVersion: 1,
    files: [
      { path: "package.json", sha256: digest(JSON.stringify({ version: "4.0.0" })) },
    ],
  })
  await writeFile(targetManifest, staleTargetManifest)
  await put({ ...request, targetManifestSha256: digest(staleTargetManifest) })
  await assert.rejects(loadRequest, /Artifact package version mismatch/)
  const targetBytes = JSON.stringify({ version: "4.0.1" })
  await writeFile(targetPackage, targetBytes)
  await writeFile(
    targetManifest,
    JSON.stringify({
      schemaVersion: 1,
      files: [{ path: "package.json", sha256: digest(targetBytes) }],
    })
  )
  await put(request)
  assert.equal((await loadRequest()).fingerprint, initial.fingerprint)
  // Both immutable 3.x baselines remain supported; no 4.0.0-to-4.0.1 migration.
  const baselinePackage = path.join(root, "baseline/package.json")
  const baselineManifest = path.join(root, "baseline/smartsite-export.json")
  const oldBytes = JSON.stringify({ version: "3.0.0" })
  const oldManifest = JSON.stringify({
    schemaVersion: 1,
    files: [{ path: "package.json", sha256: digest(oldBytes) }],
  })
  await writeFile(baselinePackage, oldBytes)
  await writeFile(baselineManifest, oldManifest)
  await put({
    ...request,
    sourceVersion: "3.0.0",
    baselineManifestSha256: digest(oldManifest),
  })
  assert.equal((await loadRequest()).request.sourceVersion, "3.0.0")
  await put({ ...request, baselineManifestSha256: digest(oldManifest) })
  await assert.rejects(loadRequest, /Artifact package version mismatch/)
  const restoredBytes = JSON.stringify({ version: "3.0.1" })
  await writeFile(baselinePackage, restoredBytes)
  await writeFile(
    baselineManifest,
    JSON.stringify({
      schemaVersion: 1,
      files: [{ path: "package.json", sha256: digest(restoredBytes) }],
    })
  )
  await put(request)
  assert.equal((await loadRequest()).fingerprint, initial.fingerprint)
  assert(!initial.env.CRON_SECRET, "Default upgrade must not need a runner secret")
  assert(!JSON.stringify(initial.request).includes("restore-private"))
  assert(initial.restoreEnv.DATABASE_URL.includes("restore-private"))
  await writeFile(
    restoreEnvironmentFile,
    "DATABASE_URL=mongodb://fixture:private@host1:27017,host2:27017/restore?replicaSet=rs\n"
  )
  assert(
    (await loadRequest()).restoreEnv.DATABASE_URL.includes("host2:27017"),
    "Mongo seed-list replica-set URIs must remain supported"
  )
  await writeFile(restoreEnvironmentFile, restoreBytes + "# reviewed destination\n")
  assert.notEqual(
    (await loadRequest()).fingerprint,
    initial.fingerprint,
    "All private restore bytes bind the fingerprint"
  )
  await writeFile(restoreEnvironmentFile, restoreBytes)
  assert.equal((await loadRequest()).fingerprint, initial.fingerprint)
  await put({
    ...request,
    restoreDatabaseURL: "mongodb://fixture:never-print-this@localhost/old",
  })
  await assert.rejects(
    loadRequest,
    error =>
      /no longer supported/.test(error.message) &&
      !error.message.includes("never-print-this")
  )
  await put(request)
  await chmod(restoreEnvironmentFile, 0o644)
  await assert.rejects(loadRequest, /owner-private/)
  await chmod(restoreEnvironmentFile, 0o600)
  await writeFile(restoreEnvironmentFile, "DATABASE_URL=private-invalid-value\n")
  await assert.rejects(
    loadRequest,
    error =>
      /valid Mongo/.test(error.message) &&
      !error.message.includes("private-invalid-value")
  )
  const job = {
    _id: "job-1",
    taskSlug: "schedulePublish",
    input: {
      doc: { relationTo: "pages", value: "page-1" },
      user: { relationTo: "users", value: "user-1" },
    },
    waitUntil: new Date("2020-01-01T00:00:00Z"),
  }
  const row = scheduledJobSummary(job)
  assert.deepEqual(row.target, { kind: "collection", slug: "pages" })
  assert.equal(row.action, "publish")
  assert.deepEqual(row.issues, [])
  assert.equal(scheduledJobSummary({ ...job, completedAt: new Date() }), null)
  assert.equal(scheduledJobSummary({ ...job, taskSlug: "unrelated" }), null)
  assert.throws(() => assertSchedulingDecision({}, [row], {}), /require a documented/)
  const paused = {
    scheduledPublishing: {
      decision: "preserve-paused",
      reason: "Owner will review existing due work before opting in",
    },
  }
  assertSchedulingDecision(paused, [row], {})
  const disabled = {
    collections: [
      { slug: "users", auth: true },
      { slug: "pages", versions: { drafts: { schedulePublish: false } } },
    ],
    globals: [],
  }
  assertSchedulingConfiguration(paused, [row], {}, disabled)
  assert.throws(
    () =>
      assertSchedulingConfiguration(
        paused,
        [row],
        {},
        {
          ...disabled,
          collections: [
            { slug: "users", auth: true },
            { slug: "pages", versions: { drafts: { schedulePublish: true } } },
          ],
        }
      ),
    /disagrees/
  )
  for (const bad of [
    { ...job.input, global: "settings" },
    { ...job.input, user: "legacy-user-id" },
    { ...job.input, type: "unexpected" },
    { ...job.input, doc: { relationTo: "pages" } },
  ])
    assert.throws(
      () =>
        assertSchedulingDecision(
          paused,
          [scheduledJobSummary({ ...job, input: bad })],
          {}
        ),
      /malformed/
    )
  const enabled = {
    scheduledPublishing: {
      decision: "enable-with-infrastructure",
      reason: "Preserve existing schedule after explicit activation",
      infrastructure: {
        kind: "external-caller",
        evidence: "private scheduler verification record",
      },
      overdueJobsReviewed: true,
      activateAfterVerification: true,
    },
  }
  assert.throws(() => assertSchedulingDecision(enabled, [row], {}), /private CRON_SECRET/)
  assertSchedulingConfiguration(
    enabled,
    [row],
    { CRON_SECRET: "private" },
    {
      collections: [
        { slug: "users", auth: true },
        { slug: "pages", versions: { drafts: { schedulePublish: {} } } },
      ],
      globals: [],
    }
  )
  const localized = scheduledJobSummary({
    ...job,
    input: { ...job.input, type: "publish", locale: "fr" },
  })
  const localizedConfig = {
    collections: [
      { slug: "users", auth: true },
      { slug: "pages", versions: { drafts: { schedulePublish: true } } },
    ],
    globals: [],
    localization: { locales: [{ code: "en" }, { code: "fr" }] },
  }
  assertSchedulingConfiguration(
    enabled,
    [localized],
    { CRON_SECRET: "private" },
    localizedConfig
  )
  assert.throws(
    () =>
      assertSchedulingConfiguration(
        enabled,
        [{ ...localized, locale: "removed" }],
        { CRON_SECRET: "private" },
        localizedConfig
      ),
    /matching configured locale/
  )
  assert.throws(
    () =>
      assertSchedulingConfiguration(
        enabled,
        [scheduledJobSummary({ ...job, input: { ...job.input, locale: "fr" } })],
        { CRON_SECRET: "private" },
        localizedConfig
      ),
    /explicit publish action/
  )
  assertSchedulingConfiguration(paused, [{ ...row, locale: "removed" }], {}, disabled)
  const global = scheduledJobSummary({
    ...job,
    input: { type: "unpublish", global: "settings", user: job.input.user },
  })
  assert.deepEqual(global.target, { kind: "global", slug: "settings" })
  assert.equal(global.action, "unpublish")
  assert.deepEqual(
    job.input,
    {
      doc: { relationTo: "pages", value: "page-1" },
      user: { relationTo: "users", value: "user-1" },
    },
    "Inventory must not mutate input"
  )
  console.log(
    JSON.stringify({
      status: "passed",
      checks: [
        "release401-target-and-both3x-baselines",
        "unsupported-release-refusal",
        "manifest-and-package-version-binding",
        "private-restore-file-contract",
        "exact-restore-byte-binding",
        "inline-and-insecure-refusal",
        "no-default-cron-prerequisite",
        "native-schedule-inventory-and-explicit-decision",
        "malformed-native-jobs-refused",
        "native-config-pause-enable-contract",
      ],
    })
  )
} finally {
  process.argv = previousArgv
  await rm(root, { recursive: true, force: true })
}
