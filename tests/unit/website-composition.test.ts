import assert from "node:assert/strict"
import test from "node:test"
import type { Config, CollectionConfig } from "payload"
import { websiteLinksPlugin } from "../../src/plugins/website-links"

test("website links resolve independently across configs and retain explicit relationships", async () => {
  const shared: CollectionConfig = {
    slug: "pages",
    custom: { smartsite: { route: true } },
    fields: [
      {
        name: "link",
        type: "relationship",
        relationTo: ["__smartsite_website_link__" as any],
        custom: { smartsiteWebsiteLink: true },
      },
      { name: "restricted", type: "relationship", relationTo: "pages" },
      {
        name: "sections",
        type: "blocks",
        blocks: [],
        blockReferences: [
          {
            slug: "inline",
            fields: [
              {
                name: "link",
                type: "relationship",
                relationTo: ["__smartsite_website_link__" as any],
                custom: { smartsiteWebsiteLink: true },
              },
            ],
          },
        ],
      },
    ],
  }
  const config = (collections: CollectionConfig[]) => ({ collections }) as Config
  const first = await websiteLinksPlugin(config([shared]))
  const second = await websiteLinksPlugin(
    config([
      shared,
      { slug: "projects", custom: { smartsite: { route: true } }, fields: [] },
    ])
  )
  assert.deepEqual((first.collections![0].fields[0] as any).relationTo, ["pages"])
  assert.deepEqual((second.collections![0].fields[0] as any).relationTo, [
    "pages",
    "projects",
  ])
  assert.deepEqual((shared.fields[0] as any).relationTo, ["__smartsite_website_link__"])
  assert.equal((second.collections![0].fields[1] as any).relationTo, "pages")
  assert.deepEqual(
    (second.collections![0].fields[2] as any).blockReferences[0].fields[0].relationTo,
    ["pages", "projects"]
  )
})
