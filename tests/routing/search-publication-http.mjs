import assert from "node:assert/strict"
import { loadState } from "../../scripts/local/state.mjs"
import { environment } from "../../scripts/local/runtime.mjs"
const local = await loadState(),
  env = await environment(local)
const origin = `http://127.0.0.1:${local.appPort}`
let state
async function advance(stage) {
  const response = await fetch(`${origin}/api/review-publication-probe`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.CRON_SECRET}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ action: "search-publication", stage, state }),
    signal: AbortSignal.timeout(90000),
  })
  assert.equal(response.status, 200, `Search publication stage ${stage} failed`)
  state = (await response.json()).state
}
async function search(query) {
  const response = await fetch(
    `${origin}/api/search?q=${encodeURIComponent(query)}&limit=50`
  )
  assert.equal(response.status, 200)
  return (await response.json()).items
}
const leaf = "Search publication leaf",
  article = "Search publication article"
async function expectHref(title, href) {
  const item = (await search(title)).find(item => item.title === title)
  assert.ok(item, `Missing public search result for ${title}`)
  assert.equal(item.href, href)
  assert.equal((await fetch(`${origin}${href}`)).status, 200)
}
async function absent(query, title) {
  assert.ok(
    !(await search(query)).some(item => item.title === title),
    `Stale search token ${query} still matches ${title}`
  )
}
await advance("create")
await expectHref(leaf, "/routeparentoldunique/searchleaf")
await expectHref(article, "/routearchiveoldunique/searchpost")
assert.ok((await search("routeparentoldunique")).some(item => item.title === leaf))
assert.ok((await search("routearchiveoldunique")).some(item => item.title === article))
await advance("parent")
await expectHref(leaf, "/routeparentnewunique/searchleaf")
await absent("routeparentoldunique", leaf)
assert.ok((await search("routeparentnewunique")).some(item => item.title === leaf))
await advance("archive")
await expectHref(article, "/routearchivenewunique/searchpost")
await absent("routearchiveoldunique", article)
assert.ok((await search("routearchivenewunique")).some(item => item.title === article))
await advance("home-parent")
await expectHref(leaf, "/searchleaf")
await absent("routeparentnewunique", leaf)
await advance("home-archive")
await expectHref(leaf, "/routeparentnewunique/searchleaf")
await expectHref(article, "/searchpost")
await absent("routearchivenewunique", article)
assert.equal((await search("PRIVATE_SEARCH_DRAFT_SENTINEL")).length, 0)
console.log(
  JSON.stringify({
    passed: [
      "search-links-follow-parent-rename",
      "search-links-follow-archive-rename",
      "search-links-follow-homepage-promotion-and-demotion",
      "search-old-route-tokens-removed",
      "search-new-route-tokens-match",
      "publication-preserves-draft-versions-content-and-timestamps",
    ],
  })
)
