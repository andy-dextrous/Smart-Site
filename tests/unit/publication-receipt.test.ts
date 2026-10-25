import assert from "node:assert/strict"
import { test } from "node:test"
import { queuePublication } from "../../src/website/publication/intent"

// Import the configured graph without connecting to a database; all I/O is mocked.
process.env.DATABASE_PROVIDER = "mongoose"
process.env.DATABASE_URL = "mongodb://127.0.0.1:1/unused_receipt_unit_test"
process.env.SMARTSITE_DATABASE_TARGET = "default"
process.env.SMARTSITE_ENVIRONMENT = "local"
process.env.PAYLOAD_SECRET = "unit-test-only-not-a-server-secret"
const { withOperation } = await import("../../src/mcp/operations")

test("operation receipts capture IDs from shallow-copied hook contexts and isolate saves", async () => {
  const receipts: any[] = [],
    work: any[] = []
  const payload: any = {
    db: {
      beginTransaction: async () => "transaction",
      commitTransaction: async () => {},
      rollbackTransaction: async () => {},
    },
    find: async (args: any) =>
      args.collection === "smartsite-operations"
        ? { docs: [] }
        : {
            docs: work.filter(row => args.where.id.in.includes(row.id)),
            totalDocs: args.where.id.in.length,
          },
    create: async (args: any) => {
      assert.equal(args.req.transactionID, "transaction")
      if (args.collection === "smartsite-operations") {
        receipts.push(args.data.result)
        return { id: String(receipts.length) }
      }
      const row = { id: `work-${work.length + 1}`, status: "pending", ...args.data }
      work.push(row)
      return row
    },
  }
  const outer: any = {
    payload,
    user: { id: "owner", role: "admin" },
    context: { smartsiteKeyId: "key", publicationWorkIds: ["unrelated"] },
  }
  for (let index = 1; index <= 2; index++) {
    const result = JSON.parse(
      (
        await withOperation(
          { target: "pages", operationId: `operation-${index}` },
          outer,
          async (_args, tx) => {
            const nested = { ...tx, context: { ...tx.context } }
            await queuePublication(nested, "routes", `pages/${index}`)
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({ document: { id: String(index) } }),
                },
              ],
            }
          }
        )
      ).content[0].text
    )
    assert.deepEqual(result.publicationWorkIds, [`work-${index}`])
    assert.deepEqual(receipts[index - 1].publicationWorkIds, result.publicationWorkIds)
    assert.equal(result.publication.total, 1)
    assert.equal(result.publication.work[0].status, "pending")
    assert.ok(
      result.warnings.some((message: string) =>
        message.includes("refresh remains pending")
      )
    )
  }
  assert.deepEqual(outer.context.publicationWorkIds, ["unrelated"])
})
