import type { AccessArgs } from "payload"
import type { User } from "@/payload-types"
import { hasMinimumRole } from "@/access/roles"

export const isEditorOrAdmin = hasMinimumRole("editor")

export function canEditContent(args: AccessArgs<User>): boolean {
  return isEditorOrAdmin(args)
}
