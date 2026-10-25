import type { PayloadRequest } from "payload"

// Checked MCP writes own this queue. Ordinary CMS requests retain their normal hooks.
export async function refreshAfterCommit(
  req: PayloadRequest,
  refresh: () => unknown | Promise<unknown>
) {
  if (Array.isArray(req.context.smartsiteAfterCommit)) {
    req.context.smartsiteAfterCommit.push(refresh)
  } else if (!req.context.disableRevalidate) {
    await refresh()
  }
}

// Cascade jobs/cache work must not escape a content transaction that can roll back.
export function deferHookAfterCommit<T extends { req: PayloadRequest }>(
  args: T,
  hook: (args: T) => unknown | Promise<unknown>
): boolean {
  const queue = args.req.context.smartsiteAfterCommit
  if (!Array.isArray(queue)) return false
  queue.push(async () =>
    hook({
      ...args,
      req: {
        ...args.req,
        transactionID: undefined,
        context: {
          ...args.req.context,
          smartsiteAfterCommit: undefined,
          disableRevalidate: false,
        },
      },
    })
  )
  return true
}
