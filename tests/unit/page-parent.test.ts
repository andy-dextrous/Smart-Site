import assert from "node:assert/strict"
import { test } from "node:test"
import { validatePageParent } from "../../src/hooks/collections/pages/validate-parent"
import { MAX_PAGE_NODES } from "../../src/website/routing/limits"
for (const existing of [false, true]) test(`parent boundary counts ${existing ? "existing" : "new"} page itself`, async () => {
  const req = { payload: { findByID: async ({ id }: { id: string }) => ({ id, parent: Number(id) > 1 ? String(Number(id) - 1) : null }) } }
  const args = { req, originalDoc: existing ? { id: "current" } : undefined }
  await validatePageParent({ ...args, data: { parent: String(MAX_PAGE_NODES - 1) } } as any)
  await assert.rejects(validatePageParent({ ...args, data: { parent: String(MAX_PAGE_NODES) } } as any), /exceeds 100 total pages/)
})
