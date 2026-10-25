/** Lifecycle is owned by the Next process; no daemon or global CLI is installed. */
export function startPublicationPoller() {
  const key = Symbol.for("smartsite.publication.poller")
  const scope = globalThis as any
  if (
    scope[key] ||
    process.env.SMARTSITE_BACKGROUND_RECOVERY !== "true" ||
    !process.env.CRON_SECRET?.trim()
  ) return
  let active = false
  scope[key] = setInterval(async () => {
    if (active) return
    active = true
    try {
      await fetch(`http://127.0.0.1:${process.env.PORT || 3000}/api/publication`, {
        headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
        signal: AbortSignal.timeout(15000),
      })
    } catch {
      /* The durable record remains pending; next poll retries after startup. */
    } finally {
      active = false
    }
  }, 10000)
  scope[key].unref()
}
