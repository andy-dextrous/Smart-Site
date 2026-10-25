export async function register() {
  if (
    process.env.NEXT_RUNTIME !== "nodejs" ||
    process.env.VERCEL ||
    process.env.NEXT_PHASE === "phase-production-build"
  )
    return
  const { startPublicationPoller } = await import("@/lib/publication/poller")
  startPublicationPoller()
}
