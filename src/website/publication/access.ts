import { timingSafeEqual } from "node:crypto"
import { userHasMinimumRole } from "@/access/roles"

export function canRunPublication(
  req: { user?: unknown; headers: Headers },
  secret = process.env.CRON_SECRET
): boolean {
  if (userHasMinimumRole(req.user, "admin")) return true
  if (!secret?.trim()) return false
  const actual = Buffer.from(req.headers.get("authorization") || "")
  const expected = Buffer.from(`Bearer ${secret}`)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
