import type { AccessArgs } from "payload"
import type { User } from "@/payload-types"
import { hasMinimumRole, userHasMinimumRole } from "@/access/roles"

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
