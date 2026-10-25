import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, rm, readFile, writeFile, mkdir } from "node:fs/promises"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import path from "node:path"
import os from "node:os"
import http from "node:http"
import { health } from "../../scripts/local/runtime.mjs"
const exec = promisify(execFile)
const stateURL = new URL("../../scripts/local/state.mjs", import.meta.url).href
const runtimeURL = new URL("../../scripts/local/runtime.mjs", import.meta.url).href

test("private state is atomic, active locks block, stale locks recover, unrelated process survives", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "smartsite-state-"))
  try {
    const code = `const s=await import(${JSON.stringify(stateURL)});await s.atomicJSON(s.local+'/state.json',{siteId:'test'});const unlock=await s.lock();try{await s.lock();throw Error('lock not enforced')}catch(e){if(!e.message.includes('Another setup'))throw e}await unlock();const r=await import(${JSON.stringify(runtimeURL)});try{await r.stopProcess({pid:process.pid,identity:'wrong'});throw Error('ownership not enforced')}catch(e){if(!e.message.includes('ownership'))throw e}console.log('ok')`
    assert.match(
      (await exec(process.execPath, ["--input-type=module", "-e", code], { cwd: dir }))
        .stdout,
      /ok/
    )
    assert.equal(
      JSON.parse(await readFile(path.join(dir, ".smartsite/local/state.json"), "utf8"))
        .siteId,
      "test"
    )
    const interrupted = `import fs from 'node:fs/promises';import {syncBuiltinESMExports} from 'node:module';fs.rename=async()=>process.exit(19);syncBuiltinESMExports();const s=await import(${JSON.stringify(stateURL)});await s.atomicJSON(s.local+'/state.json',{siteId:'partial-new'})`
    await assert.rejects(
      exec(process.execPath, ["--input-type=module", "-e", interrupted], { cwd: dir })
    )
    assert.equal(
      JSON.parse(await readFile(path.join(dir, ".smartsite/local/state.json"), "utf8"))
        .siteId,
      "test"
    )
    await exec(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `const s=await import(${JSON.stringify(stateURL)});await s.atomicJSON(s.local+'/state.json',{siteId:'resumed'})`,
      ],
      { cwd: dir }
    )
    assert.equal(
      JSON.parse(await readFile(path.join(dir, ".smartsite/local/state.json"), "utf8"))
        .siteId,
      "resumed"
    )
    await writeFile(
      path.join(dir, ".smartsite/local/setup.lock"),
      JSON.stringify({ pid: 2147483647 })
    )
    await exec(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `const s=await import(${JSON.stringify(stateURL)});await (await s.lock())()`,
      ],
      { cwd: dir }
    )
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
test("an unrelated HTTP 200 server cannot satisfy app identity", async () => {
  const server = http.createServer((_req, res) => {
    res.setHeader("Content-Type", "application/json")
    res.end(JSON.stringify({ siteId: "different", environment: "local", database: true }))
  })
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve))
  try {
    await assert.rejects(
      health({ siteId: "expected", appPort: (server.address() as any).port }),
      /identity/
    )
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()))
  }
})
