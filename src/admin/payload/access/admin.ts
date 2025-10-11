import type { AccessArgs } from "payload"
import type { User } from "@/admin/payload/payload-types"
import { hasMinimumRole, userHasMinimumRole } from "@/admin/payload/access/roles"

export const isAdmin = hasMinimumRole("admin")

export function isAdminOrSelf(args: AccessArgs<User>): boolean {
  const {
    req: { user },
    id,
  } = args

  if (userHasMinimumRole(user, "admin")) {
    return true
  }

  if (user && id) {
    return user.id === id
  }

  return false
}

export const isAdminOrAiAgent = hasMinimumRole("admin")
