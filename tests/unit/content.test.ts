import test from "node:test"
import assert from "node:assert/strict"
import { projectFields } from "../../src/mcp/projection"
import { revision, validatePatch } from "../../src/mcp/contracts"

test("projection drops hook-added private objects and applies nested field access", async () => {
  const req: any = {}
  const fields: any = [
    { name: "title", type: "text" },
    { name: "authors", type: "relationship", relationTo: "users", hasMany: true },
    {
      name: "rows",
      type: "array",
      fields: [
        { name: "text", type: "text" },
        { name: "secret", type: "text", access: { read: () => false } },
      ],
    },
    {
      name: "sections",
      type: "blocks",
      blocks: [{ slug: "hero", fields: [{ name: "heading", type: "text" }] }],
    },
  ]
  const value = {
    id: "1",
    title: "Hello",
    password: "sentinel",
    authors: [{ id: "u1", email: "sentinel", apiKey: "sentinel" }],
    rows: [{ id: "r1", text: "Copy", secret: "sentinel", unknown: "sentinel" }],
    sections: [
      { id: "b1", blockType: "hero", heading: "Welcome", user: { password: "sentinel" } },
    ],
  }
  const result = await projectFields(req, fields, value)
  assert.deepEqual(result.authors, ["u1"])
  assert.equal(result.rows[0].id, "r1")
  assert.equal(result.sections[0].heading, "Welcome")
  assert.ok(!JSON.stringify(result).includes("sentinel"))
})
test("revisions are order independent and patches reject system/prototype mutation", () => {
  assert.equal(revision({ a: 1, b: 2 }), revision({ b: 2, a: 1 }))
  assert.notEqual(revision({ a: 1 }), revision({ a: 2 }))
  assert.throws(() => validatePatch({ _status: "published" }))
  assert.throws(() =>
    validatePatch(JSON.parse('{"nested":{"__proto__":{"role":"admin"}}}'))
  )
})

test("rich text preserves links and schema-defined blocks without leaking populated users", async () => {
  const blockFields: any = [
    { name: "heading", type: "text" },
    { name: "author", type: "relationship", relationTo: "users" },
  ]
  const req: any = { payload: { config: {} }, i18n: {} }
  const fields: any = [
    {
      name: "body",
      type: "richText",
      editor: {
        editorConfig: {
          resolvedFeatureMap: new Map([
            [
              "blocks",
              {
                generateSchemaMap: () =>
                  new Map([["lexical_blocks.callout.fields", { fields: blockFields }]]),
              },
            ],
          ]),
        },
      },
    },
  ]
  const value = {
    body: {
      root: {
        type: "root",
        version: 1,
        children: [
          {
            type: "link",
            fields: { url: "/contact", linkType: "custom", newTab: false },
            children: [{ type: "text", text: "Contact" }],
          },
          {
            type: "block",
            fields: {
              id: "row",
              blockType: "callout",
              heading: "Useful",
              author: { id: "u1", email: "private-sentinel" },
              unknown: "private-sentinel",
            },
          },
        ],
      },
    },
  }
  const result = await projectFields(req, fields, value)
  assert.equal(result.body.root.children[0].fields.url, "/contact")
  assert.equal(result.body.root.children[1].fields.heading, "Useful")
  assert.equal(result.body.root.children[1].fields.author, "u1")
  assert.ok(!JSON.stringify(result).includes("private-sentinel"))
})
