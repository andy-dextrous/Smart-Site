import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, mkdir, readFile, writeFile, symlink, rm, readdir } from "node:fs/promises"
import path from "node:path"
import os from "node:os"
import { copyMedia } from "../../docker/copy-media.mjs"

test("Docker media relocation preserves originals/variants and refuses conflicts or links", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "smartsite-media-copy-"))
  const source = path.join(root, "source"), target = path.join(root, "target")
  try {
    await mkdir(source)
    await mkdir(path.join(source, "nested"))
    await writeFile(path.join(source, "original.webp"), "original bytes")
    await writeFile(path.join(source, "nested/thumb.webp"), "thumbnail bytes")
    const report = await copyMedia(source, target)
    assert.equal(report.files.length, 2)
    assert.deepEqual(await copyMedia(source, target), report)
    assert.equal(await readFile(path.join(source, "original.webp"), "utf8"), "original bytes")
    assert.equal(await readFile(path.join(target, "nested/thumb.webp"), "utf8"), "thumbnail bytes")
    await writeFile(path.join(target, "original.webp"), "a different upload")
    await writeFile(path.join(source, "new.webp"), "new bytes")
    await assert.rejects(copyMedia(source, target), /Conflicting existing media/)
    assert.ok(!(await readdir(target)).includes("new.webp"), "collision preflight copies no new files")
    await rm(path.join(target, "original.webp"))
    await symlink(path.join(source, "original.webp"), path.join(target, "original.webp"))
    await assert.rejects(copyMedia(source, target), /Conflicting existing media/)
    await rm(path.join(target, "original.webp"))
    await symlink(path.join(source, "original.webp"), path.join(source, "link.webp"))
    await assert.rejects(copyMedia(source, target), /symlink requires manual review/)
    await assert.rejects(copyMedia(source, source), /separate directories/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test("prebuilt releases rebuild the secret-dependent builder for each public URL", async () => {
  const { execFile } = await import("node:child_process")
  const { promisify } = await import("node:util")
  const { chmod } = await import("node:fs/promises")
  const { fileURLToPath } = await import("node:url")
  const execute = promisify(execFile)
  const root = await mkdtemp(path.join(os.tmpdir(), "smartsite-build-env-"))
  try {
    const capture = path.join(root, "capture.json")
    const fakeDocker = path.join(root, "docker")
    await writeFile(fakeDocker, `#!${process.execPath}\nrequire('node:fs').writeFileSync(process.env.DOCKER_CAPTURE, JSON.stringify(process.argv.slice(2)))\n`)
    await chmod(fakeDocker, 0o700)
    const envFile = path.join(root, "private build.env")
    await writeFile(envFile, "FIXTURE=true\n", { mode: 0o600 })
    const helper = fileURLToPath(new URL("../../docker/build-prebuilt-release.sh", import.meta.url))
    for (const [index, gateway] of ["", "1"].entries()) {
      await execute("sh", [helper, envFile, "fixture:prebuilt", "", `https://deployment-${index}.example.test`, `fixture-${index}`], {
        env: { ...process.env, PATH: `${root}${path.delimiter}${process.env.PATH}`, DOCKER_CAPTURE: capture, SMARTSITE_BUILD_USE_HOST_GATEWAY: gateway },
      })
      const args: string[] = JSON.parse(await readFile(capture, "utf8"))
      assert.equal(args[0], "build")
      assert.equal(args[args.indexOf("--no-cache-filter") + 1], "builder")
      assert.equal(args.includes("--add-host=host.docker.internal:host-gateway"), gateway === "1")
      const secretPath = args[args.indexOf("--secret") + 1].split(",src=")[1]
      await assert.rejects(readFile(secretPath), { code: "ENOENT" }, "temporary build secret was removed")
    }
    assert.equal(await readFile(envFile, "utf8"), "FIXTURE=true\n", "source environment is unchanged")
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
