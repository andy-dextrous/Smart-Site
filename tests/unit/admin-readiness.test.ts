import test from "node:test"
import assert from "node:assert/strict"
import http from "node:http"
import { spawn } from "node:child_process"
import { mkdtemp, writeFile, rm } from "node:fs/promises"
import path from "node:path"
import os from "node:os"
import { checkAdminReadiness, readAdminCompileSummary, ADMIN_REQUEST_TIMEOUT_MS, ADMIN_STARTUP_TIMEOUT_MS } from "../../scripts/local/admin-readiness.mjs"
import { owned, processIdentity } from "../../scripts/local/state.mjs"

const timing = { requestTimeoutMs: 80, startupTimeoutMs: 1000, ownershipPollMs: 20, logPath: "/missing-admin-readiness-fixture.log" }
async function fixture(handler: (response: http.ServerResponse) => void, check: (state: any, requests: () => number) => Promise<void>, matchingHealth = true) {
  let requests = 0
  const server = http.createServer((request, response) => {
    if (request.url === "/api/smartsite/health") {
      response.setHeader("content-type", "application/json")
      response.end(JSON.stringify({ siteId: matchingHealth ? "readiness-fixture" : "another-site", environment: "local", database: true }))
    } else {
      assert.equal(request.url, "/admin/login")
      requests++
      handler(response)
    }
  })
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve))
  try {
    await check({ siteId: "readiness-fixture", appPort: (server.address() as any).port, appProcess: { pid: process.pid, identity: processIdentity(process.pid) } }, () => requests)
  } finally {
    server.closeAllConnections()
    await new Promise<void>(resolve => server.close(() => resolve()))
  }
}

test("one cold admin request can finish beyond the short deadline only for an owned matching app", async () => {
  assert.equal(ADMIN_REQUEST_TIMEOUT_MS, 30000)
  assert.equal(ADMIN_STARTUP_TIMEOUT_MS, 180000)
  const slow = (response: http.ServerResponse) => { const timer = setTimeout(() => response.end("<html>CMS login</html>"), 180); response.on("close", () => clearTimeout(timer)) }
  await fixture(slow, async (state, requests) => {
    const result = await checkAdminReadiness(state, timing)
    assert.equal(result.responding, true)
    assert.equal(result.readiness.verifiedLocalStartup, true)
    assert.equal(result.readiness.budgetMs, 1000)
    assert.equal(requests(), 1)
  })
  for (const matchingHealth of [true, false]) {
    await fixture(slow, async (state, requests) => {
      if (matchingHealth) state.appProcess.identity = "stale-record"
      await assert.rejects(checkAdminReadiness(state, timing), (error: any) => {
        assert.equal(error.diagnostics.failure, "deadline-exceeded")
        assert.equal(error.diagnostics.verifiedLocalStartup, false)
        assert.equal(error.diagnostics.budgetMs, 80)
        return true
      })
      assert.equal(requests(), 1)
    }, matchingHealth)
  }
})

test("HTTP500 and non-HTML fail without retries; the deadline also covers a stalled body", async () => {
  for (const status of [500, 200]) {
    await fixture(response => { response.writeHead(status); response.end(status === 500 ? "private error detail" : "not HTML") }, async (state, requests) => {
      await assert.rejects(checkAdminReadiness(state, timing), (error: any) => {
        assert.equal(error.diagnostics.failure, status === 500 ? "http-error" : "invalid-html")
        assert.ok(!JSON.stringify(error.diagnostics).includes("private error detail"))
        return true
      })
      assert.equal(requests(), 1)
    })
  }
  await fixture(response => { response.writeHead(200); response.write("<html>unfinished") }, async (state, requests) => {
    state.appProcess.identity = "stale-record"
    await assert.rejects(checkAdminReadiness(state, timing), (error: any) => error.diagnostics.failure === "deadline-exceeded")
    assert.equal(requests(), 1)
  })
})

test("owned-process exit aborts the pending admin request", async () => {
  const child = spawn(process.execPath, ["-e", "setInterval(()=>{},1000)"], { stdio: "ignore" })
  const exited = new Promise<void>(resolve => child.once("exit", () => resolve()))
  await new Promise<void>((resolve, reject) => { child.once("spawn", () => resolve()); child.once("error", reject) })
  const info = { pid: child.pid!, identity: processIdentity(child.pid!) }
  try {
    await fixture(response => {
      response.writeHead(200)
      response.write("<html>unfinished")
      // The request starts only after ownership and matching health are verified.
      if (owned(info)) process.kill(info.pid, "SIGTERM")
    }, async (state, requests) => {
      state.appProcess = info
      await assert.rejects(checkAdminReadiness(state, timing), (error: any) => error.diagnostics.failure === "app-ownership-lost")
      assert.equal(requests(), 1)
    })
  } finally {
    if (owned(info)) process.kill(info.pid, "SIGTERM")
    await exited
  }
})

test("compiler diagnostics retain only bounded event metadata, never log contents", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "smartsite-admin-diagnostics-"))
  try {
    const file = path.join(directory, "app.log")
    const secret = "do-not-retain-private-value"
    await writeFile(file, "x".repeat(70000) + `\n\u001b[32m○ Compiling /admin/[[...segments]] ...\u001b[0m\n✓ Compiled in 93.3s\nGET /admin/login?token=${secret} 200 in 94.2s\nError: DATABASE_URL=mongodb://user:${secret}@host/private\nPAYLOAD_SECRET=${secret}\n`)
    const summary = await readAdminCompileSummary(file)
    assert.equal(summary.available, true)
    assert.equal(summary.tailOnly, true)
    assert.equal(summary.bytesExamined, 65536)
    assert.deepEqual(summary.events, [{ event: "admin-compilation-started" }, { event: "compilation-completed", durationMs: 93300 }, { event: "admin-response", status: 200, durationMs: 94200 }, { event: "compile-or-runtime-error" }])
    assert.ok(!JSON.stringify(summary).includes(secret))
    assert.ok(!JSON.stringify(summary).includes("mongodb"))
    assert.deepEqual(await readAdminCompileSummary(path.join(directory, "missing")), { available: false, events: [] })
    await fixture(response => { response.writeHead(500); response.end(secret) }, async state => {
      await assert.rejects(checkAdminReadiness(state, { ...timing, logPath: file }), (error: any) => {
        assert.deepEqual(error.diagnostics.compilation, summary)
        assert.ok(!JSON.stringify({ message: error.message, ...error.diagnostics }).includes(secret))
        return true
      })
    })
  } finally { await rm(directory, { recursive: true, force: true }) }
})
