import assert from "node:assert/strict"
import { test } from "node:test"
import { isUnroutedDocument } from "../../src/website/routing/route-eligibility"

const args = (overrides: any = {}) => {
  const { indexed = false, children = false, routing = {}, ...rest } = overrides
  const req: any = { transactionID: "same-transaction" }
  req.payload = {
    findGlobal: async (input: any) => {
      assert.equal(input.req, req)
      return { routing }
    },
    find: async (input: any) => {
      assert.equal(input.req, req)
      assert.equal(input.limit, 1)
      return { docs: (input.collection === "uri-index" ? indexed : children) ? [{}] : [] }
    },
  }
  return { req, collection: "team", data: { id: "profile", slug: "" }, ...rest }
}

test("blank profiles remain unrouted without assigning a slug", async () => {
  for (const slug of [undefined, null, "", " "]) {
    const input = args({ data: { id: "profile", slug } })
    assert.equal(await isUnroutedDocument(input), true)
    assert.equal(input.data.slug, slug)
  }
})
test("an explicit slug opts a profile into routing", async () => {
  assert.equal(
    await isUnroutedDocument(args({ data: { id: "profile", slug: "alan" } })),
    false
  )
})
test("blank existing routes fail rather than silently disappear", async () => {
  await assert.rejects(
    isUnroutedDocument(args({ data: { id: "profile", slug: "", uri: "/team/alan" } })),
    /existing route/
  )
  await assert.rejects(isUnroutedDocument(args({ indexed: true })), /indexed route/)
  await assert.rejects(
    isUnroutedDocument(args({ originalDoc: { uri: "/team/alan" } })),
    /existing route/
  )
})
test("the selected homepage remains routable by ID", async () => {
  assert.equal(
    await isUnroutedDocument(
      args({ collection: "pages", routing: { homepage: { id: "profile" } } })
    ),
    false
  )
})
test("unrouted pages cannot silently become archive or parent roots", async () => {
  await assert.rejects(
    isUnroutedDocument(
      args({ collection: "pages", routing: { teamArchivePage: "profile" } })
    ),
    /referenced page/
  )
  await assert.rejects(
    isUnroutedDocument(args({ collection: "pages", children: true })),
    /referenced page/
  )
})
test("non-string invalid slugs are errors", async () => {
  await assert.rejects(
    isUnroutedDocument(args({ data: { id: "profile", slug: {} } })),
    /Invalid slug/
  )
})
