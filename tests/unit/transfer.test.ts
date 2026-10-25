import test from "node:test"
import assert from "node:assert/strict"
import { mapReferences } from "../../scripts/content-transfer/references"

test("transfer discovers and remaps media and required accounts inside Lexical blocks", async () => {
  const block: any = [
    { name: "image", type: "upload", relationTo: "media" },
    { name: "author", type: "relationship", relationTo: "users", required: true },
  ]
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
                  new Map([["lexical_blocks.quote.fields", { fields: block }]]),
              },
            ],
          ]),
        },
      },
    },
  ]
  const req: any = { payload: { config: {} }, i18n: {} }
  const refs: any[] = []
  const source = {
    body: {
      root: {
        type: "root",
        children: [
          {
            type: "block",
            fields: {
              id: "row",
              blockType: "quote",
              image: "source-image",
              author: "source-user",
            },
          },
        ],
      },
    },
  }
  const mapped = await mapReferences(
    fields,
    source,
    async ref => {
      refs.push(ref)
      return "destination-" + ref.id
    },
    "",
    req
  )
  assert.deepEqual(
    refs.map(r => [r.target, r.required]),
    [
      ["media", false],
      ["users", true],
    ]
  )
  assert.equal(mapped.body.root.children[0].fields.image, "destination-source-image")
  assert.equal(mapped.body.root.children[0].fields.author, "destination-source-user")
  assert.equal(source.body.root.children[0].fields.author, "source-user")
})
