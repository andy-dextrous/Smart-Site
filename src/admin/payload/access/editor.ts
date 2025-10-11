import type { AccessArgs } from "payload"
import type { User } from "@/admin/payload/payload-types"
import { hasMinimumRole } from "@/admin/payload/access/roles"

export const isEditorOrAdmin = hasMinimumRole("editor")

export function canEditContent(args: AccessArgs<User>): boolean {
  return isEditorOrAdmin(args)
}
