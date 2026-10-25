import type { PayloadRequest } from "payload"
import { buildSearchText } from "@/lib/search/search-text"

/** Keep existing public search projections in the same fenced route transaction. */
export async function reconcileSearchRoute(
  req: PayloadRequest,
  sourceCollection: string,
  document: { id: string | number; _status?: string; deletedAt?: unknown },
  uri: string
) {
  // Optional plugins may be absent from the site's generated CollectionSlug union.
  const search = req.payload.config.collections.find(
    item => (item.slug as string) === "search"
  )
  if (!search || document._status === "draft" || document.deletedAt) return
  let after: string | number | undefined
  while (true) {
    const rows = await req.payload.find({
      collection: search.slug,
      req,
      overrideAccess: true,
      depth: 0,
      pagination: false,
      limit: 25,
      sort: "id",
      where: {
        and: [
          { "doc.relationTo": { equals: sourceCollection } },
          { "doc.value": { equals: document.id } },
          ...(after === undefined ? [] : [{ id: { greater_than: after } }]),
        ],
      },
    })
    for (const row of rows.docs as any[]) {
      const searchText = buildSearchText({ ...row, uri })
      if (row.uri === uri && row.searchText === searchText) continue
      // Do not replay content/search hooks, create results for excluded documents,
      // or replace the public projection with a newer draft version.
      await req.payload.db.updateOne({
        collection: search.slug,
        req,
        where: { id: { equals: row.id } },
        data: { uri, searchText, updatedAt: null },
        returning: true,
      })
    }
    if (rows.docs.length < 25) break
    after = rows.docs.at(-1)!.id
  }
}
