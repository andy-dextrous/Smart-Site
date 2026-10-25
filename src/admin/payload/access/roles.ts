import type { AccessArgs } from "payload"
import type { User } from "@/admin/payload/payload-types"

type RoleKey = "editor" | "admin" | "ai-agent" | "developer"

const ROLE_PRIORITY: Record<RoleKey, number> = {
  editor: 1,
  admin: 2,
  "ai-agent": 0,
  developer: 3,
}

function getRoleRank(role: unknown): number | null {
  if (typeof role !== "string") {
    return null
  }

  if (role in ROLE_PRIORITY) {
    return ROLE_PRIORITY[role as RoleKey]
  }

  return null
}

export function userHasMinimumRole(
  user: unknown,
  minimumRole: RoleKey
): boolean {
  const minimumRank = ROLE_PRIORITY[minimumRole]
  const userRank = getRoleRank(user && typeof user === "object" && "role" in user ? user.role : undefined)

  if (userRank === null) {
    return false
  }

  return userRank >= minimumRank
}

export function hasMinimumRole(minimumRole: RoleKey) {
  return function minimumRoleAccess(args: AccessArgs<User>): boolean {
    const { req } = args
    return userHasMinimumRole(req.user, minimumRole)
  }
}
