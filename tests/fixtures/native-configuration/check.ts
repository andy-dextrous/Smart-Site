import assert from "node:assert/strict"
import { getPayload, type Field } from "payload"
import configPromise from "@payload-config"
import site from "@/site.config"
import { catalogue, contentTarget } from "@/mcp/contracts"
import { assertWebsiteInventory, websiteCollections } from "@/website/collection-metadata"
import { NativeProjects } from "./config"

const config = await configPromise
const names = config.collections.map(collection => collection.slug)
assert.ok(names.includes("native-projects" as any))
assert.ok(!names.includes("search"))
assert.equal(site.features.search.enabled, false)
assert.deepEqual(
  config.localization && config.localization.locales.map(locale => locale.code),
  ["en", "fr"]
)
const inventory = websiteCollections(config)
assert.ok(inventory.some(collection => collection.slug === "native-projects"))
const expected = inventory.map(collection => collection.slug)
assert.throws(
  () =>
    assertWebsiteInventory(inventory)({
      ...config,
      collections: [
        ...config.collections,
        { slug: "late-project", custom: { smartsite: { route: true } }, fields: [] },
      ],
    } as any),
  /later plugin changed/
)
const { getSearchResults } = await import("@/website/data/search")
assert.deepEqual((await getSearchResults({ query: "disabled search" })).items, [])
let markedLinks = 0,
  sections = 0,
  globals = 0,
  rootBlocks = 0
function fields(items: Field[], owner: string) {
  for (const field of items) {
    assert.ok(
      !("preview" in (field.admin || {})),
      `Collection preview leaked into field admin: ${owner}`
    )
    assert.ok(
      !("livePreview" in (field.admin || {})),
      `Collection live preview leaked into field admin: ${owner}`
    )
    if (field.type === "relationship") {
      assert.ok(
        !JSON.stringify(field.relationTo).includes("__smartsite_website_link__"),
        owner
      )
      if (field.custom?.smartsiteWebsiteLink) {
        markedLinks++
        assert.deepEqual(field.relationTo, expected, owner)
        if (owner.includes("sections")) sections++
        if (owner.startsWith("global/")) globals++
        if (owner.startsWith("block/")) rootBlocks++
      }
    }
    if ("fields" in field) fields(field.fields, owner)
    if (field.type === "tabs") for (const tab of field.tabs) fields(tab.fields, owner)
    if (field.type === "blocks")
      for (const block of [...(field.blocks || []), ...(field.blockReferences || [])])
        if (typeof block !== "string")
          fields(block.fields, `${owner}/${"name" in field ? field.name : "blocks"}`)
  }
}
for (const collection of config.collections)
  fields(collection.fields, `collection/${collection.slug}`)
for (const global of config.globals) fields(global.fields, `global/${global.slug}`)
for (const block of config.blocks || []) fields(block.fields, `block/${block.slug}`)
assert.ok(markedLinks > 10 && sections > 0 && globals > 0 && rootBlocks > 0)
const project = config.collections.find(
  collection => collection.slug === ("native-projects" as any)
)!
assert.equal(
  (project.fields.find(field => "name" in field && field.name === "restricted") as any)
    .relationTo,
  "pages"
)
assert.equal(typeof project.admin.preview, "function")
assert.equal(typeof project.admin.livePreview?.url, "function")
const services = config.collections.find(collection => collection.slug === "services")!
assert.equal(typeof services.admin.preview, "function")
assert.equal(typeof services.admin.livePreview?.url, "function")
// Binding must not mutate imported schema objects shared between config builds.
assert.ok(JSON.stringify(NativeProjects.fields).includes("__smartsite_website_link__"))
const allowed = catalogue(config)
assert.ok(allowed.collections.includes("native-projects"))
assert.ok(allowed.globals.includes("native-announcement"))
for (const target of [
  "native-private",
  "users",
  "site-publication-work",
  "payload-mcp-api-keys",
])
  assert.throws(() => contentTarget(target, config))
assert.equal(contentTarget("native-projects", config), "collection")
assert.equal(contentTarget("native-announcement", config), "global")
// The browser configuration is literal public presentation data, never providers.
const browserJSON = JSON.stringify(site)
for (const secret of [
  process.env.PAYLOAD_SECRET,
  process.env.CRON_SECRET,
  process.env.DATABASE_URL,
])
  if (secret) assert.ok(!browserJSON.includes(secret))
assert.ok(!/apiSecret|databasePassword|accessKeyId|secretAccessKey/.test(browserJSON))
const payload = await getPayload({ config })
try {
  const created = await payload.create({
    collection: "native-projects" as any,
    overrideAccess: true,
    locale: "en",
    data: {
      title: "English native project",
      privateNote: "PRIVATE CONFIGURATION TEST",
      body: {
        root: {
          type: "root",
          version: 1,
          direction: "ltr",
          format: "",
          indent: 0,
          children: [
            {
              type: "block",
              version: 2,
              format: "",
              fields: {
                blockType: "native-link-probe",
                link: {
                  type: "custom",
                  url: "https://example.test/",
                  label: "Native link",
                },
              },
            },
          ],
        },
      },
    },
  })
  await payload.update({
    collection: "native-projects" as any,
    id: created.id,
    overrideAccess: true,
    locale: "fr",
    data: { title: "Projet natif français" },
  })
  for (const [locale, title] of [
    ["en", "English native project"],
    ["fr", "Projet natif français"],
  ]) {
    const doc: any = await payload.findByID({
      collection: "native-projects" as any,
      id: created.id,
      locale: locale as any,
      overrideAccess: false,
    })
    assert.equal(doc.title, title)
    assert.equal(doc.privateNote, undefined)
    assert.equal(doc.body.root.children[0].fields.blockType, "native-link-probe")
  }
  await assert.rejects(
    payload.create({
      collection: "native-projects" as any,
      overrideAccess: false,
      data: { title: "Denied" },
    }),
    /not allowed|forbidden/i
  )
  console.log(
    JSON.stringify({
      passed: [
        "native-collection-registration",
        "search-disabled",
        "localized-data-roundtrip",
        "deferred-global-section-lexical-links",
        "explicit-relationship-preserved",
        "shared-schema-not-mutated",
        "collection-preview-placement",
        "mcp-opt-in-and-internal-exclusion",
        "normal-access-and-private-field-enforced",
        "browser-config-excludes-server-secrets",
      ],
      markedLinks,
    })
  )
} finally {
  await payload.destroy()
}
