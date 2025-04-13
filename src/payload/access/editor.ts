import type { AccessArgs } from "payload"

// Checks if the user is an editor or admin
export const isEditorOrAdmin = ({ req: { user } }: AccessArgs<any>): boolean => {
  return Boolean(user?.role === "editor" || user?.role === "admin")
}

// Collection access for editors - can access Pages, Posts, Menus
export const canEditContent = ({ req: { user } }: AccessArgs<any>): boolean => {
  return Boolean(user?.role === "editor" || user?.role === "admin")
}
