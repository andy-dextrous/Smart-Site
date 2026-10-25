import test from "node:test"
import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { mkdtemp, readFile, writeFile, rm, chmod, stat, access } from "node:fs/promises"
import path from "node:path"
import os from "node:os"
import { fileURLToPath } from "node:url"

const exec = promisify(execFile)
const helper = fileURLToPath(new URL("../../scripts/create-self-hosted-build-env.mjs", import.meta.url))
const wrapper = fileURLToPath(new URL("../../docker/build-prebuilt-release.sh", import.meta.url))
const probe = "const keys=JSON.parse(process.argv[1]);process.stdout.write(JSON.stringify(Object.fromEntries(keys.map(key=>[key,process.env[key]]))))"
const shellProbe = 'set -a; . "$1"; set +a; exec "$2" -e "$3" "$4"'

async function readShell(file: string, keys: string[]) {
  const result = await exec("sh", ["-eu", "-c", shellProbe, "verify", file, process.execPath, probe, JSON.stringify(keys)])
  return JSON.parse(result.stdout)
}

test("build environment survives real shell and wrapper roundtrips without expansion or secret output", { skip: process.platform === "win32" }, async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "smartsite-build-literals-"))
  try {
    const marker = path.join(directory, "must-not-execute")
    const source = path.join(directory, "source.env"), output = path.join(directory, "build.env")
    const shellLiteral = `$(touch ${marker}) \`touch ${marker}\` $HOME \${HOME}`
    const expected = {
      SIMPLE: "plain",
      EMPTY: "",
      SHELL_LITERAL: shellLiteral,
      QUOTES: `both 'single' and "double" quotes`,
      QUOTE_SEQUENCE: `'"'"'`,
      MULTILINE: "line one\nNEXT_PUBLIC_URL=inside-value\nline three 'quoted'",
      HASH: "literal # content",
      BACKSLASH: "C:\\folder\\file",
      DATABASE_URL: "mongodb://fixture:private-build-value@db/owned?authSource=admin&replicaSet=rs&directConnection=true",
    }
    const text = `# dotenv input; expressions are data, not commands\nSIMPLE=plain\nEMPTY=\nSHELL_LITERAL='${shellLiteral}'\nQUOTES=\`${expected.QUOTES}\`\nQUOTE_SEQUENCE=\`${expected.QUOTE_SEQUENCE}\`\nMULTILINE="${expected.MULTILINE}"\nHASH='${expected.HASH}'\nBACKSLASH='${expected.BACKSLASH}'\nDATABASE_URL=old-value\n`
    await writeFile(source, text, { mode: 0o600 })
    await writeFile(output, "previous", { mode: 0o644 })
    await chmod(output, 0o644)
    const generated = await exec(process.execPath, [helper, "--source", source, "--output", output, "--database-url", expected.DATABASE_URL])
    assert.ok(!generated.stdout.includes(expected.DATABASE_URL) && !generated.stderr.includes(expected.DATABASE_URL))
    assert.equal((await stat(output)).mode & 0o777, 0o600)
    assert.deepEqual(await readShell(output, Object.keys(expected)), expected)
    assert.equal(await readFile(source, "utf8"), text)
    await assert.rejects(access(marker))

    // Exercise the actual wrapper and its BuildKit secret input, replacing only
    // Docker execution with a capture process. That process sources the real file.
    const capture = path.join(directory, "capture.json")
    const docker = path.join(directory, "docker")
    await writeFile(docker, `#!${process.execPath}\nconst fs=require('node:fs');const {execFileSync}=require('node:child_process');const args=process.argv.slice(2);const file=args[args.indexOf('--secret')+1].split(',src=')[1];const stdout=execFileSync('sh',['-eu','-c',${JSON.stringify(shellProbe)},'verify',file,process.execPath,${JSON.stringify(probe)},process.env.BUILD_TEST_KEYS],{encoding:'utf8'});fs.writeFileSync(process.env.BUILD_TEST_CAPTURE,JSON.stringify({values:JSON.parse(stdout),mode:fs.statSync(file).mode&511,secretPath:file}),{mode:384});\n`, { mode: 0o700 })
    const publicURL = `https://example.test/?a=one&b=$HOME&c=$(touch ${marker})`
    const deploymentId = `release 'quoted' $HOME\n$(touch ${marker})`
    const overrides = { NODE_ENV: "production", SMARTSITE_DEPLOYMENT_PROFILE: "self-hosted-mongo", NEXT_PUBLIC_URL: publicURL, NEXT_PUBLIC_SITE_URL: publicURL, NEXT_PUBLIC_PRODUCTION_URL: publicURL, NEXT_DEPLOYMENT_ID: deploymentId }
    for (const input of [output, source]) {
      const result = await exec("sh", [wrapper, input, "fixture:build", "", publicURL, deploymentId], { env: { ...process.env, PATH: `${directory}${path.delimiter}${process.env.PATH}`, BUILD_TEST_CAPTURE: capture, BUILD_TEST_KEYS: JSON.stringify([...Object.keys(expected), ...Object.keys(overrides)]) } })
      const captured = JSON.parse(await readFile(capture, "utf8"))
      assert.deepEqual(captured.values, { ...expected, DATABASE_URL: input === source ? "old-value" : expected.DATABASE_URL, ...overrides })
      assert.equal(captured.mode, 0o600)
      assert.ok(!result.stdout.includes(expected.DATABASE_URL) && !result.stderr.includes(expected.DATABASE_URL))
      assert.ok(!result.stdout.includes(publicURL) && !result.stdout.includes(deploymentId))
      await assert.rejects(readFile(captured.secretPath), { code: "ENOENT" })
      await assert.rejects(access(marker))
    }
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test("invalid generated syntax, unsafe identifiers and NUL fail before replacing output", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "smartsite-build-invalid-"))
  try {
    const source = path.join(directory, "source.env"), output = path.join(directory, "build.env")
    for (const content of ["BAD-KEY=value\n", "VALUE=before\0after\n", "# SmartSite build environment: literal POSIX assignments v1\nVALUE='safe'\nprintf unsafe\n", "# SmartSite build environment: unknown version\nVALUE='safe'\n"]) {
      await writeFile(source, content)
      await writeFile(output, "preserved", { mode: 0o600 })
      await assert.rejects(exec(process.execPath, [helper, "--source", source, "--output", output, "--database-url", "mongodb://db/test"]))
      assert.equal(await readFile(output, "utf8"), "preserved")
    }
  } finally { await rm(directory, { recursive: true, force: true }) }
})
