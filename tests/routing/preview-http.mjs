import assert from "node:assert/strict"
import { mkdir, writeFile } from "node:fs/promises"
import { loadState, local, readJSON } from "../../scripts/local/state.mjs"
import { environment } from "../../scripts/local/runtime.mjs"
import { mcpRequest } from "../../scripts/local/clients.mjs"

const state = await loadState(),
  credentials = await readJSON(`${local}/credentials.json`)
const env = await environment(state),
  origin = `http://127.0.0.1:${state.appPort}`
const request = (url, options = {}) =>
  fetch(url, {
    ...options,
    headers: { "sec-fetch-site": "same-origin", ...options.headers },
  })
const call = async (name, args) =>
  JSON.parse(
    (await mcpRequest(state, credentials, "tools/call", { name, arguments: args }))
      .content[0].text
  )
const save = args => call("smartsiteSave", { operationId: crypto.randomUUID(), ...args })
async function login(username, password) {
  const response = await request(`${origin}/api/users/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
  assert.equal(response.status, 200)
  return `payload-token=${(await response.json()).token}`
}
const owner = await login("owner", credentials.adminPassword)
async function createUser(username) {
  const password = crypto.randomUUID() + crypto.randomUUID()
  const response = await request(`${origin}/api/users`, {
    method: "POST",
    headers: { cookie: owner, "content-type": "application/json" },
    body: JSON.stringify({
      username,
      email: `${username}@example.test`,
      password,
      name: "Preview",
      lastName: "Fixture",
      role: "editor",
    }),
  })
  assert.equal(response.status, 201)
  return login(username, password)
}
const denied = await createUser("preview-denied"),
  limited = await createUser("preview-field-limited")
await createUser("preview-parent-denied")
await createUser("preview-title-limited")
const publishedHeading = "PREVIEW PUBLIC HEADING"
const draftHeading = "PREVIEW PRIVATE DRAFT HEADING"
const templateHeading = "PREVIEW RESTRICTED FALLBACK TEMPLATE"
const parent = await save({
  action: "create",
  target: "pages",
  mode: "publish",
  data: {
    title: "Preview parent",
    slug: "preview-parent",
    sections: [{ blockType: "hero", heading: publishedHeading }],
  },
})
const child = await save({
  action: "create",
  target: "pages",
  mode: "publish",
  data: {
    title: "Preview child",
    slug: "preview-child",
    parent: parent.document.id,
    sections: [{ blockType: "hero", heading: publishedHeading }],
  },
})
const home = await save({
  action: "create",
  target: "pages",
  mode: "publish",
  data: {
    title: "Preview home",
    slug: "preview-home",
    sections: [{ blockType: "hero", heading: publishedHeading }],
  },
})
const empty = await save({
  action: "create",
  target: "pages",
  mode: "publish",
  data: { title: "Empty preview", slug: "empty-preview", sections: [] },
})
const template = await save({
  action: "create",
  target: "templates",
  mode: "live",
  data: {
    name: "Preview permission fallback",
    sections: [{ blockType: "hero", heading: templateHeading }],
  },
})
const settings = await call("smartsiteRead", { action: "get", target: "settings" })
await save({
  action: "update",
  target: "settings",
  mode: "live",
  expectedRevision: settings.revision,
  data: {
    routing: {
      ...settings.document.routing,
      homepage: home.document.id,
      pagesDefaultTemplate: template.document.id,
    },
  },
})
for (const document of [home.document, child.document]) {
  const current = await call("smartsiteRead", {
    action: "get",
    target: "pages",
    id: document.id,
  })
  await save({
    action: "update",
    target: "pages",
    id: document.id,
    mode: "draft",
    expectedRevision: current.revision,
    data: { sections: [{ blockType: "hero", heading: draftHeading }] },
  })
}
async function preview(
  path,
  cookie = owner,
  collection = "pages",
  documentId = child.document.id
) {
  return request(
    `${origin}/api/preview?${new URLSearchParams({ path, collection, documentId, previewSecret: env.PREVIEW_SECRET })}`,
    { redirect: "manual", headers: cookie ? { cookie } : {} }
  )
}
const unsafe = [
  "//evil.example/x",
  "/.//evil.example/x",
  "/a/..//evil.example/x",
  "/preview//evil.example/x",
  "/\\evil.example/x",
  "/%2fevil.example/x",
  "/%5cevil.example/x",
  "/%00evil",
]
for (const path of unsafe) {
  const exit = await request(
    `${origin}/api/exit-preview?${new URLSearchParams({ redirect: path })}`,
    { redirect: "manual" }
  )
  assert.equal(exit.status, 307)
  const destination = new URL(exit.headers.get("location"))
  assert.equal(destination.origin, new URL(env.NEXT_PUBLIC_URL).origin)
  assert.equal(destination.pathname, "/", path)
  assert.equal((await preview(path)).status, 400, path)
}
assert.equal((await preview("/", "")).status, 403)
assert.equal((await preview("/", owner, "users")).status, 400)
for (const path of ["/", "/preview-parent/preview-child"]) {
  for (const cookie of [
    "__prerender_bypass=expired-build-id",
    `${owner}; __prerender_bypass=expired-build-id`,
  ]) {
    const response = await request(
      `${origin}${path}?keep=one&keep=two&preview=true&livePreview=true&previewCollection=pages&previewDocumentId=${child.document.id}`,
      { redirect: "manual", headers: { cookie } }
    )
    // Next can stream the layout before a nested route redirects. In that case
    // the browser follows its explicit redirect meta tag in the 200 response.
    let exitLocation = response.headers.get("location")
    if (response.status === 200) {
      const html = await response.text()
      assert.ok(!html.includes(draftHeading))
      exitLocation = html
        .match(/id="__next-page-redirect"[^>]*content="[0-9]+;url=([^"]+)"/)?.[1]
        ?.replaceAll("&amp;", "&")
    } else assert.equal(response.status, 307, path)
    assert.ok(exitLocation, "Stale cookie must redirect through preview exit")
    const exitURL = new URL(exitLocation, origin)
    assert.equal(exitURL.pathname, "/api/exit-preview")
    const exit = await request(exitURL, { redirect: "manual", headers: { cookie } })
    assert.equal(exit.status, 307)
    const destination = new URL(exit.headers.get("location"))
    assert.equal(destination.pathname, path)
    assert.deepEqual(
      [...destination.searchParams],
      [
        ["keep", "one"],
        ["keep", "two"],
      ]
    )
    assert.ok(
      exit.headers
        .getSetCookie()
        .some(
          value => value.startsWith("__prerender_bypass=;") && value.includes("Max-Age=0")
        )
    )
    const publicResponse = await request(destination)
    assert.equal(publicResponse.status, 200)
    const html = await publicResponse.text()
    assert.ok(html.includes(publishedHeading))
    assert.ok(!html.includes(draftHeading))
  }
}
assert.equal(
  (await request(`${origin}/preview/preview-parent/preview-child`)).status,
  404
)
const handshake = await preview("/preview-parent/preview-child?keep=ok")
assert.equal(handshake.status, 307)
const bypass = handshake.headers
  .getSetCookie()
  .find(value => value.startsWith("__prerender_bypass="))
  ?.split(";")[0]
assert.ok(bypass)
const target = handshake.headers.get("location")
for (const [cookie, status, visible, label] of [
  [`${owner}; ${bypass}`, 200, true, "owner"],
  [bypass, 404, false, "logged-out"],
  [`${denied}; ${bypass}`, 404, false, "denied"],
  [`${limited}; ${bypass}`, 200, false, "limited"],
]) {
  const response = await request(target, { headers: { cookie } })
  assert.equal(response.status, status, label)
  const html = await response.text()
  assert.equal(html.includes(draftHeading), visible, label)
  if (label === "limited") {
    await mkdir("test-results", { recursive: true, mode: 0o700 })
    await writeFile("test-results/preview-limited.html", html, { mode: 0o600 })
    const nativeResponse = await request(
      `${origin}/api/pages/${child.document.id}?draft=true&depth=0`,
      { headers: { cookie: limited } }
    )
    assert.equal(nativeResponse.status, 200)
    const nativeDocument = await nativeResponse.json()
    console.log(
      JSON.stringify({
        nativeDeniedSections: {
          ownProperty: Object.hasOwn(nativeDocument, "sections"),
          value: nativeDocument.sections,
        },
      })
    )
    assert.deepEqual(nativeDocument.sections, [])
    // Public settings may serialize the configured template; assert that denied
    // sections are not restored into the rendered page by a fallback read.
    const rendered = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    assert.ok(!rendered.includes(templateHeading), "Denied sections must not be refilled")
  }
}
const emptyHandshake = await preview("/empty-preview", owner, "pages", empty.document.id)
assert.equal(emptyHandshake.status, 307)
const emptyResponse = await request(emptyHandshake.headers.get("location"), {
  headers: { cookie: `${owner}; ${bypass}` },
})
assert.equal(emptyResponse.status, 200)
const emptyRendered = (await emptyResponse.text()).replace(
  /<script\b[^>]*>[\s\S]*?<\/script>/gi,
  ""
)
assert.ok(
  emptyRendered.includes(templateHeading),
  "Allowed empty sections must retain the default template"
)
// The URI-index lookup path must enforce the same access without explicit hints.
const direct = await request(`${origin}/preview/preview-parent/preview-child`, {
  headers: { cookie: `${denied}; ${bypass}` },
})
assert.equal(direct.status, 404)
console.log(
  JSON.stringify({
    passed: [
      "stale-preview-root",
      "stale-preview-nested-query",
      "anonymous-forged-cookie-public-recovery",
      "exit-cookie-expiration",
      "normalized-same-origin-redirects",
      "no-user-preview-denied",
      "non-route-hint-denied",
      "authorized-draft-preview",
      "logged-out-valid-cookie-denied",
      "native-collection-denial",
      "native-field-denial-no-template-refill",
      "allowed-empty-sections-template-fallback",
    ],
  })
)
