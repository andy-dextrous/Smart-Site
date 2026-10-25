// Read-only decisions about existing native jobs. Never invoke Payload jobs here.
const slug = value =>
  typeof value === "string" && /^[A-Za-z][A-Za-z0-9_-]{0,99}$/.test(value)
const id = value =>
  (typeof value === "string" && value.length > 0) ||
  (typeof value === "number" && Number.isFinite(value))
const object = value =>
  value !== null && typeof value === "object" && !Array.isArray(value)
export function scheduledJobSummary(doc) {
  if (doc.taskSlug !== "schedulePublish" || doc.completedAt) return null
  const row = {
    jobId: String(doc._id),
    action: null,
    actionWasImplicit: false,
    locale: null,
    target: null,
    waitUntil: null,
    processing: doc.processing === true,
    userCollection: null,
    issues: [],
  }
  const input = doc.input
  if (!object(input)) {
    row.issues.push("invalid-input")
    return row
  }
  if (input.type === undefined) {
    row.action = "publish"
    row.actionWasImplicit = true
  } else if (["publish", "unpublish"].includes(input.type)) row.action = input.type
  else row.issues.push("invalid-action")
  if (input.locale !== undefined && input.locale !== null && input.locale !== "") {
    if (typeof input.locale !== "string" || !/^[A-Za-z0-9_-]{1,100}$/.test(input.locale))
      row.issues.push("invalid-locale")
    else row.locale = input.locale
  }
  const hasDoc = Object.hasOwn(input, "doc"),
    hasGlobal = Object.hasOwn(input, "global")
  if (hasDoc === hasGlobal) row.issues.push("ambiguous-or-missing-target")
  else if (
    hasDoc &&
    object(input.doc) &&
    slug(input.doc.relationTo) &&
    id(input.doc.value)
  )
    row.target = { kind: "collection", slug: input.doc.relationTo }
  else if (hasGlobal && slug(input.global))
    row.target = { kind: "global", slug: input.global }
  else row.issues.push("invalid-target")
  if (!object(input.user) || !slug(input.user.relationTo) || !id(input.user.value))
    row.issues.push("unsupported-user-reference")
  else row.userCollection = input.user.relationTo
  if (doc.waitUntil !== undefined && doc.waitUntil !== null) {
    if (!(doc.waitUntil instanceof Date) || !Number.isFinite(doc.waitUntil.getTime()))
      row.issues.push("invalid-wait-until")
    else row.waitUntil = doc.waitUntil.toISOString()
  }
  return row
}
export function assertSchedulingDecision(request, inventory, env) {
  if (!inventory?.length) return
  if (inventory.some(row => row.issues.length))
    throw new Error(
      "Unfinished native schedulePublish jobs have malformed action/target/user/date data; review the private scheduling inventory and repair deliberately before upgrading"
    )
  const decision = request.scheduledPublishing
  if (
    !decision ||
    !["preserve-paused", "enable-with-infrastructure"].includes(decision.decision) ||
    typeof decision.reason !== "string" ||
    !decision.reason.trim()
  )
    throw new Error(
      "Unfinished native schedulePublish jobs require a documented scheduledPublishing decision: preserve-paused or enable-with-infrastructure"
    )
  if (decision.decision === "enable-with-infrastructure") {
    if (
      !env.CRON_SECRET?.trim() ||
      !["persistent-process", "external-caller"].includes(
        decision.infrastructure?.kind
      ) ||
      typeof decision.infrastructure?.evidence !== "string" ||
      !decision.infrastructure.evidence.trim() ||
      decision.overdueJobsReviewed !== true ||
      decision.activateAfterVerification !== true
    )
      throw new Error(
        "Enabling existing scheduled publications requires a private CRON_SECRET, documented infrastructure evidence, overdueJobsReviewed and activateAfterVerification"
      )
    if (
      decision.infrastructure.kind === "persistent-process" &&
      env.SMARTSITE_BACKGROUND_RECOVERY !== "true"
    )
      throw new Error(
        "Persistent scheduled-publication infrastructure requires explicit SMARTSITE_BACKGROUND_RECOVERY=true"
      )
  }
}
export function assertSchedulingConfiguration(request, inventory, env, config) {
  assertSchedulingDecision(request, inventory, env)
  if (!inventory?.length) return
  if (
    request.scheduledPublishing.decision === "preserve-paused" &&
    (typeof config.jobs?.autoRun === "function" || config.jobs?.autoRun?.length)
  )
    throw new Error(
      "Paused scheduled publications require reviewing and disabling native jobs.autoRun before startup"
    )
  for (const row of inventory) {
    if (
      request.scheduledPublishing.decision === "enable-with-infrastructure" &&
      row.locale
    ) {
      const locales = config.localization?.locales ?? []
      if (
        row.action !== "publish" ||
        row.actionWasImplicit ||
        !locales.some(
          locale => (typeof locale === "string" ? locale : locale.code) === row.locale
        )
      )
        throw new Error(
          "Localized scheduled publication requires an explicit publish action and a matching configured locale; review stale locale jobs before enabling"
        )
    }
    if (!config.collections.some(item => item.slug === row.userCollection && item.auth))
      throw new Error(
        "An unfinished native scheduled-publication user reference is not a configured auth collection"
      )
    const choices = row.target.kind === "collection" ? config.collections : config.globals
    const target = choices.find(item => item.slug === row.target.slug)
    if (!target)
      throw new Error(
        "An unfinished native scheduled-publication target is absent from the reconciled config"
      )
    const enabled = Boolean(
      target.versions && target.versions.drafts && target.versions.drafts.schedulePublish
    )
    if (
      enabled !==
      (request.scheduledPublishing.decision === "enable-with-infrastructure")
    )
      throw new Error(
        "Native versions.drafts.schedulePublish disagrees with the documented existing-job decision"
      )
  }
}
