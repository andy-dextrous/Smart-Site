import assert from "node:assert/strict"
import { test } from "node:test"
import { buildSearchText } from "../../src/website/search/search-text"
import { reconcileSearchRoute } from "../../src/website/publication/search-route"

test("search text uses only current projection fields", () => {
  assert.equal(
    buildSearchText({
      title: "Public title",
      slug: "child",
      uri: "/new/child",
      meta: { description: "Description" },
      categories: [{ title: "Category" }],
    }),
    "public title child /new/child description category"
  )
})
test("route reconciliation updates URI and tokens in the same transaction without rewriting source content", async () => {
  const writes: any[] = []
  const req: any = { transactionID: "fenced-batch", context: { preventHooks: true } }
  req.payload = {
    config: { collections: [{ slug: "search" }] },
    find: async (args: any) => {
      assert.equal(args.req, req)
      assert.equal(args.depth, 0)
      assert.deepEqual(args.where.and.slice(0, 2), [
        { "doc.relationTo": { equals: "pages" } },
        { "doc.value": { equals: "page" } },
      ])
      return {
        docs: [
          {
            id: "search-row",
            title: "Public title",
            slug: "child",
            uri: "/old/child",
            searchText: "public title /old/child",
            categories: [{ title: "Category" }],
            priority: 42,
          },
        ],
      }
    },
    db: {
      updateOne: async (args: any) => {
        writes.push(args)
        return {}
      },
    },
  }
  await reconcileSearchRoute(
    req,
    "pages",
    { id: "page", _status: "published" },
    "/new/child"
  )
  assert.equal(writes.length, 1)
  assert.equal(writes[0].req, req)
  assert.equal(writes[0].collection, "search")
  assert.deepEqual(writes[0].data, {
    uri: "/new/child",
    searchText: "public title child /new/child category",
    updatedAt: null,
  })
})
test("disabled search and nonpublic documents perform no search reads or writes", async () => {
  for (const [collections, doc] of [
    [[], { id: "page", _status: "published" }],
    [[{ slug: "search" }], { id: "page", _status: "draft" }],
    [[{ slug: "search" }], { id: "page", deletedAt: "2026-01-01" }],
  ] as const) {
    const unexpected = () => {
      throw new Error("Unexpected search I/O")
    }
    await reconcileSearchRoute(
      {
        payload: {
          config: { collections },
          find: unexpected,
          db: { updateOne: unexpected },
        },
      } as any,
      "pages",
      doc,
      "/new"
    )
  }
})
test("excluded documents are not added back to search", async () => {
  const req: any = {
    payload: {
      config: { collections: [{ slug: "search" }] },
      find: async () => ({ docs: [] }),
      db: {
        updateOne: () => {
          throw new Error("Unexpected search write")
        },
      },
    },
  }
  await reconcileSearchRoute(req, "pages", { id: "excluded" }, "/new")
})
