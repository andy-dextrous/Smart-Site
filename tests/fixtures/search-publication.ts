import assert from "node:assert/strict"
import type { Payload } from "payload"
import { drainPublication } from "../../src/lib/publication/runner"

export async function exerciseSearchPublication(
  payload: Payload,
  deliver: () => Promise<void>,
  input: any
) {
  let state = input.state
  const page = (title: string, slug: string, parent?: string) =>
    payload.create({
      collection: "pages",
      overrideAccess: true,
      data: {
        title,
        slug,
        parent,
        _status: "published",
        sections: [{ blockType: "hero", heading: title }],
      },
    })
  const snapshot = async (collection: "pages" | "posts", id: string) => {
    const doc = await payload.findByID({
      collection,
      id,
      depth: 0,
      draft: false,
      overrideAccess: true,
    })
    const versions = await payload.countVersions({
      collection,
      where: { parent: { equals: id } },
      overrideAccess: true,
    })
    return { updatedAt: doc.updatedAt, title: doc.title, versions: versions.totalDocs }
  }
  if (input.stage === "create") {
    const parent = await page("Search route parent", "routeparentoldunique")
    const child = await page("Search publication leaf", "searchleaf", String(parent.id))
    const archive = await page("Search route archive", "routearchiveoldunique")
    await payload.updateGlobal({
      slug: "settings",
      overrideAccess: true,
      data: { routing: { postsArchivePage: archive.id } },
    })
    const post = await payload.create({
      collection: "posts",
      overrideAccess: true,
      data: {
        title: "Search publication article",
        slug: "searchpost",
        _status: "published",
      },
    })
    await payload.update({
      collection: "pages",
      id: child.id,
      overrideAccess: true,
      draft: true,
      data: {
        title: "PRIVATE_SEARCH_DRAFT_SENTINEL",
        _status: "draft",
        sections: [{ blockType: "hero", heading: "PRIVATE_SEARCH_DRAFT_SENTINEL" }],
      },
    })
    state = {
      parent: parent.id,
      child: child.id,
      archive: archive.id,
      post: post.id,
      childBefore: await snapshot("pages", String(child.id)),
      postBefore: await snapshot("posts", String(post.id)),
    }
  } else if (input.stage === "parent") {
    await payload.update({
      collection: "pages",
      id: state.parent,
      overrideAccess: true,
      data: { slug: "routeparentnewunique" },
    })
  } else if (input.stage === "archive") {
    await payload.update({
      collection: "pages",
      id: state.archive,
      overrideAccess: true,
      data: { slug: "routearchivenewunique" },
    })
  } else if (input.stage === "home-parent") {
    await payload.updateGlobal({
      slug: "settings",
      overrideAccess: true,
      data: { routing: { homepage: state.parent } },
    })
  } else if (input.stage === "home-archive") {
    await payload.updateGlobal({
      slug: "settings",
      overrideAccess: true,
      data: { routing: { homepage: state.archive } },
    })
  } else throw new Error("Unknown search publication stage")
  await drainPublication(payload, deliver, 60000)
  assert.deepEqual(await snapshot("pages", state.child), state.childBefore)
  assert.deepEqual(await snapshot("posts", state.post), state.postBefore)
  const rows = await payload.find({
    collection: "search" as any,
    depth: 0,
    overrideAccess: true,
    where: { "doc.value": { in: [state.child, state.post] } },
    limit: 10,
  })
  assert.equal(rows.docs.length, 2)
  for (const row of rows.docs as any[]) {
    const source = await payload.findByID({
      collection: row.doc.relationTo,
      id: row.doc.value,
      depth: 0,
      draft: false,
      overrideAccess: true,
    })
    assert.equal(row.uri, (source as any).uri)
    assert.ok(row.searchText.includes(row.uri.toLowerCase()))
    assert.ok(!row.searchText.includes("private_search_draft_sentinel"))
  }
  return { state }
}
