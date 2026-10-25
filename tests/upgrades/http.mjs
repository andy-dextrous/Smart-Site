import assert from "node:assert/strict"
import { readFile, writeFile } from "node:fs/promises"
import { pathToFileURL } from "node:url"
const root = process.cwd(),
  state = JSON.parse(await readFile(".smartsite/local/state.json")),
  credentials = JSON.parse(await readFile(".smartsite/local/credentials.json"))
const { startApp, stopProcess } = await import(
  pathToFileURL(`${root}/scripts/local/runtime.mjs`)
)
const { mcpRequest } = await import(pathToFileURL(`${root}/scripts/local/clients.mjs`))
const call = async (name, args) => {
  const response = await mcpRequest(state, credentials, "tools/call", {
    name,
    arguments: args,
  })
  assert(!response.isError, JSON.stringify(response))
  return JSON.parse(response.content[0].text)
}
await startApp(state)
try {
  const evidence = process.argv[3]
  if (process.argv[2] === "populate") {
    const page = await call("smartsiteSave", {
      action: "create",
      target: "pages",
      mode: "publish",
      operationId: crypto.randomUUID(),
      data: { title: "Preserved public page", slug: "preserved-public", sections: [] },
    })
    const child = await call("smartsiteSave", {
      action: "create",
      target: "pages",
      mode: "publish",
      operationId: crypto.randomUUID(),
      data: {
        title: "Preserved child",
        slug: "child",
        parent: page.document.id,
        sections: [],
      },
    })
    const current = await call("smartsiteRead", {
      action: "get",
      target: "pages",
      id: child.document.id,
    })
    await call("smartsiteSave", {
      action: "update",
      target: "pages",
      id: child.document.id,
      mode: "draft",
      operationId: crypto.randomUUID(),
      expectedRevision: current.revision,
      data: { title: "Private unpublished title" },
    })
    await writeFile(
      evidence,
      JSON.stringify({ pageId: page.document.id, childId: child.document.id })
    )
  } else {
    const e = JSON.parse(await readFile(evidence)),
      health = await (
        await fetch(`http://127.0.0.1:${state.appPort}/api/smartsite/health`)
      ).json()
    assert.equal(health.siteId, e.siteId)
    const response = await fetch(`http://127.0.0.1:${state.appPort}/preserved-public`)
    assert.equal(response.status, 200)
    if (process.argv[2] === "check") {
      const origin = `http://127.0.0.1:${state.appPort}`
      const login = await fetch(`${origin}/api/users/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "owner", password: credentials.adminPassword }),
      })
      assert.equal(login.status, 200)
      const token = (await login.json()).token
      const headers = {
        authorization: `JWT ${token}`,
        "content-type": "application/json",
      }
      const status = await fetch(`${origin}/api/publication?status`, { headers })
      assert.equal(status.status, 200)
      const originalWork = (await status.json()).work.filter(
        work => work.source === "upgrade/4.0.0/legacy-jobs"
      )
      assert(
        originalWork.some(work => work.status === "pending"),
        "Migration work must remain pending with default background recovery off"
      )
      for (const auth of [{}, { authorization: "Bearer wrong-fixture-runner" }])
        assert.equal(
          (
            await fetch(`${origin}/api/publication`, {
              method: "POST",
              headers: { ...auth, "content-type": "application/json" },
              body: "{}",
            })
          ).status,
          403
        )
      let pending = originalWork
      for (let attempt = 0; pending.length && attempt < 20; attempt++) {
        const drained = await fetch(`${origin}/api/publication`, {
          method: "POST",
          headers,
          body: "{}",
        })
        assert.equal(drained.status, 200)
        pending = (await drained.json()).work.filter(work =>
          originalWork.some(original => original.id === work.id)
        )
      }
      assert.equal(
        pending.length,
        0,
        "Authenticated explicit recovery must complete migration work without a hidden poller"
      )
      const idle = await fetch(`${origin}/api/publication`, { headers })
      assert.equal(idle.status, 200)
      assert.equal((await idle.json()).scheduled.enabled, false)
      const created = await call("smartsiteSave", {
        action: "create",
        target: "pages",
        mode: "draft",
        operationId: crypto.randomUUID(),
        data: {
          title: "Disposable native upgrade write",
          slug: "native-upgrade-write",
          sections: [],
        },
      })
      assert.equal(created.committed, true)
      const current = await call("smartsiteRead", {
        action: "get",
        target: "pages",
        id: created.document.id,
      })
      const operationId = crypto.randomUUID()
      const updated = await call("smartsiteSave", {
        action: "update",
        target: "pages",
        id: created.document.id,
        mode: "draft",
        expectedRevision: current.revision,
        operationId,
        data: { title: "Checked native upgrade write" },
      })
      assert.equal(updated.committed, true)
      const receipt = await call("smartsiteOperationStatus", { operationId })
      assert.equal(receipt.status, "committed")
      assert.equal(receipt.result.document.id, created.document.id)
      const readback = await call("smartsiteRead", {
        action: "get",
        target: "pages",
        id: created.document.id,
      })
      assert.equal(readback.document.title, "Checked native upgrade write")
      assert.equal((await fetch(`${origin}/native-upgrade-write`)).status, 404)
    }
    if (process.argv[2] === "check-rollback") {
      const created = await call("smartsiteSave", {
        action: "create",
        target: "pages",
        mode: "draft",
        operationId: crypto.randomUUID(),
        data: { title: "Rollback HTTP write works", slug: "rollback-http", sections: [] },
      })
      assert(created.document.id)
    }
    const result = await call("smartsiteRead", {
      action: "get",
      target: "pages",
      id: e.childId,
    })
    assert.equal(result.document.id, e.childId)
    console.log(
      JSON.stringify({
        status: "passed",
        http: true,
        existingMcpKey: true,
        siteId: health.siteId,
      })
    )
  }
} finally {
  const latest = JSON.parse(await readFile(".smartsite/local/state.json"))
  await stopProcess(latest.appProcess)
}
