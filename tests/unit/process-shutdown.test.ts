import test from "node:test"
import assert from "node:assert/strict"
import { spawn, execFile, execFileSync, type ChildProcess } from "node:child_process"
import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises"
import { promisify } from "node:util"
import os from "node:os"
import path from "node:path"
import { stopProcess } from "../../scripts/local/runtime.mjs"
import { alive, owned, processIdentity, waitFor } from "../../scripts/local/state.mjs"

const exec = promisify(execFile)
const runtimeURL = new URL("../../scripts/local/runtime.mjs", import.meta.url).href
const supported = process.platform !== "win32"
function ready(child: ChildProcess): Promise<any> {
  return new Promise((resolve, reject) => {
    let output = ""
    child.once("error", reject)
    child.once("exit", code => reject(new Error(`Fixture exited before ready: ${code}`)))
    child.stdout!.on("data", data => {
      output += data
      if (output.includes("\n")) resolve(JSON.parse(output.split("\n")[0]))
    })
  })
}
async function idle() {
  const child = spawn(process.execPath, ["-e", 'console.log(JSON.stringify({pid:process.pid}));setInterval(()=>{},1000)'], { stdio: ["ignore", "pipe", "pipe"] })
  await ready(child)
  return { child, info: { pid: child.pid!, identity: processIdentity(child.pid!) } }
}
async function tree(directory: string) {
  const marker = path.join(directory, "worker-stopped")
  const worker = `require('fs').writeFileSync(${JSON.stringify(marker + ".ready")},'ready');process.on('SIGTERM',()=>{require('fs').writeFileSync(${JSON.stringify(marker)},'terminated');process.exit(0)});process.send('ready');setInterval(()=>{},1000)`
  const parent = `const {spawn}=require('child_process');const child=spawn(process.execPath,['-e',${JSON.stringify(worker)}],{stdio:['ignore','ignore','ignore','ipc']});let stopping=false;process.on('SIGTERM',()=>{stopping=true;if(child.exitCode!==null)process.exit(0)});child.on('exit',()=>{if(stopping)process.exit(0)});child.on('message',()=>console.log(JSON.stringify({pid:process.pid,worker:child.pid})));setInterval(()=>{},1000)`
  const child = spawn(process.execPath, ["-e", parent], { detached: true, stdio: ["ignore", "pipe", "pipe"] })
  const details = await ready(child)
  return { child, marker, info: { pid: child.pid!, identity: processIdentity(child.pid!) }, worker: { pid: details.worker, identity: processIdentity(details.worker) } }
}
async function cleanup(info: { pid: number; identity: string | null }) {
  if (owned(info)) {
    process.kill(info.pid, "SIGTERM")
    await waitFor(() => !owned(info), 5000)
  }
}

test("verified detached shutdown terminates parent and worker; stale identities cannot signal the group", { skip: !supported, timeout: 30000 }, async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "smartsite-stop-group-"))
  const fixture = await tree(directory)
  try {
    assert.equal(Number(execFileSync("ps", ["-p", String(fixture.info.pid), "-o", "pgid="], { encoding: "utf8" }).trim()), fixture.info.pid)
    await assert.rejects(stopProcess({ ...fixture.info, identity: "stale-or-reused-pid" }), /ownership/)
    assert.ok(owned(fixture.info) && owned(fixture.worker))
    assert.equal(await stopProcess(fixture.info), true)
    assert.ok(!owned(fixture.info) && !owned(fixture.worker))
    assert.equal(await readFile(fixture.marker, "utf8"), "terminated")
    assert.equal(await stopProcess(fixture.info), false)
  } finally {
    // Only individually verified fixture identities are touched on failure.
    await cleanup(fixture.worker)
    await cleanup(fixture.info)
    await rm(directory, { recursive: true, force: true })
  }
})

test("non-detached database-like process shutdown preserves its shared-group sibling", { skip: !supported, timeout: 10000 }, async () => {
  const target = await idle(), sibling = await idle()
  try {
    const group = (pid: number) => Number(execFileSync("ps", ["-p", String(pid), "-o", "pgid="], { encoding: "utf8" }).trim())
    assert.notEqual(group(target.info.pid), target.info.pid)
    assert.equal(group(target.info.pid), group(sibling.info.pid))
    assert.equal(await stopProcess(target.info), true)
    assert.ok(owned(sibling.info))
  } finally {
    await cleanup(target.info)
    await cleanup(sibling.info)
  }
})

test("missing group metadata and unsupported platforms fail closed without signaling a live target", { skip: !supported, timeout: 10000 }, async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "smartsite-stop-metadata-"))
  const target = await idle()
  try {
    const realPS = execFileSync("which", ["ps"], { encoding: "utf8" }).trim()
    const bin = path.join(directory, "bin")
    await mkdir(bin)
    await writeFile(path.join(bin, "ps"), `#!/bin/sh\ncase "$*" in *pgid=*) exit 9;; esac\nexec '${realPS.replaceAll("'", "'\\''")}' "$@"\n`, { mode: 0o700 })
    const check = (setup: string, pattern: string) => `import assert from 'node:assert/strict';${setup};const {stopProcess}=await import(${JSON.stringify(runtimeURL)});await assert.rejects(stopProcess(${JSON.stringify(target.info)}),new RegExp(${JSON.stringify(pattern)}));console.log('preserved')`
    assert.match((await exec(process.execPath, ["--input-type=module", "-e", check("", "Cannot verify process group")], { env: { ...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH}` } })).stdout, /preserved/)
    assert.ok(owned(target.info))
    assert.match((await exec(process.execPath, ["--input-type=module", "-e", check("Object.defineProperty(process,'platform',{value:'win32'})", "Cannot verify POSIX")])).stdout, /preserved/)
    assert.ok(owned(target.info))
    assert.equal(alive(2147483647), false)
    assert.equal(await stopProcess({ pid: 2147483647, identity: "missing" }), false)
  } finally {
    await cleanup(target.info)
    await rm(directory, { recursive: true, force: true })
  }
})
