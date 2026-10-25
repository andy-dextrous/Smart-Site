import { open } from "node:fs/promises"
import { stripVTControlCharacters } from "node:util"
import { owned, local } from "./state.mjs"
import { health } from "./runtime.mjs"

export const ADMIN_REQUEST_TIMEOUT_MS = 30000
// First-request Payload admin compilation shares bootstrap's bounded startup budget.
export const ADMIN_STARTUP_TIMEOUT_MS = 180000

export async function readAdminCompileSummary(logPath = `${local}/app.log`) {
  let file
  try {
    file = await open(logPath, "r")
    const { size } = await file.stat()
    const length = Math.min(size, 64 * 1024)
    const buffer = Buffer.alloc(length)
    const { bytesRead } = await file.read(buffer, 0, length, size - length)
    const events = []
    for (const raw of buffer.subarray(0, bytesRead).toString("utf8").split("\n")) {
      const line = stripVTControlCharacters(raw)
      // Deliberately retain only fixed event names and numeric timing/status.
      // Source snippets, URLs, query strings, credentials and error messages stay private.
      if (/\bCompiling \/admin(?:\/|\s|$)/.test(line))
        events.push({ event: "admin-compilation-started" })
      const compiled = line.match(/\bCompiled\b.*?\bin ([\d.]+)(ms|s)\b/)
      if (compiled) {
        const durationMs = Number(compiled[1]) * (compiled[2] === "s" ? 1000 : 1)
        if (Number.isFinite(durationMs)) events.push({ event: "compilation-completed", durationMs })
      }
      const request = line.match(/\b(?:GET|HEAD) \/admin\/login(?:\?\S*)? (\d{3}) in ([\d.]+)(ms|s)\b/)
      if (request) {
        const durationMs = Number(request[2]) * (request[3] === "s" ? 1000 : 1)
        if (Number.isFinite(durationMs)) events.push({ event: "admin-response", status: Number(request[1]), durationMs })
      }
      if (/Failed to compile|Module not found|(?:^|\s)Error:/.test(line))
        events.push({ event: "compile-or-runtime-error" })
    }
    return { available: true, bytesExamined: bytesRead, tailOnly: size > length, events: events.slice(-12) }
  } catch {
    return { available: false, events: [] }
  } finally {
    await file?.close()
  }
}

export async function checkAdminReadiness(state, {
  requestTimeoutMs = ADMIN_REQUEST_TIMEOUT_MS,
  startupTimeoutMs = ADMIN_STARTUP_TIMEOUT_MS,
  ownershipPollMs = 1000,
  logPath = `${local}/app.log`,
} = {}) {
  // An unrelated listener or a copied/stale PID cannot earn an extended budget.
  const verifiedLocalStartup = owned(state.appProcess) && await health(state).then(() => owned(state.appProcess), () => false)
  const budgetMs = verifiedLocalStartup ? startupTimeoutMs : requestTimeoutMs
  const started = performance.now()
  const controller = new AbortController()
  let failure = "request-failed"
  const timer = setTimeout(() => {
    failure = "deadline-exceeded"
    controller.abort()
  }, budgetMs)
  const watcher = verifiedLocalStartup ? setInterval(() => {
    if (!owned(state.appProcess)) {
      failure = "app-ownership-lost"
      controller.abort()
    }
  }, ownershipPollMs) : undefined
  try {
    // One request, including its body, gets this budget. HTTP errors are never retried.
    const response = await fetch(`http://127.0.0.1:${state.appPort}/admin/login`, { signal: controller.signal })
    if (!response.ok) {
      void response.body?.cancel().catch(() => {})
      failure = "http-error"
      throw new Error(`CMS login returned HTTP ${response.status}`)
    }
    if (!(await response.text()).includes("<html")) {
      failure = "invalid-html"
      throw new Error("CMS login did not return an HTML page")
    }
    if (verifiedLocalStartup && !owned(state.appProcess)) {
      failure = "app-ownership-lost"
      throw new Error("Recorded local app stopped during the CMS check")
    }
    return { responding: true, visualVerification: "required", readiness: { verifiedLocalStartup, budgetMs, elapsedMs: Math.round(performance.now() - started) } }
  } catch (cause) {
    const message = failure === "deadline-exceeded"
      ? `CMS login exceeded its ${budgetMs}ms readiness deadline`
      : failure === "app-ownership-lost"
        ? "Recorded local app stopped or changed ownership during the CMS check"
        : failure === "http-error" || failure === "invalid-html"
          ? cause.message
          : "CMS login request failed"
    const error = new Error(message)
    error.diagnostics = { failure, verifiedLocalStartup, budgetMs, elapsedMs: Math.round(performance.now() - started), compilation: await readAdminCompileSummary(logPath) }
    throw error
  } finally {
    clearTimeout(timer)
    if (watcher) clearInterval(watcher)
  }
}
