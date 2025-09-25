import type { AccessArgs } from "payload"

export const isAdmin = ({ req: { user } }: AccessArgs<any>): boolean => {
  return Boolean(user?.role === "admin")
}

export const isAdminOrSelf = ({ req: { user }, id }: AccessArgs<any>): boolean => {
  return Boolean(user?.role === "admin" || (user && user.id === id))
}

export const isAdminOrAiAgent = ({ req: { user } }: AccessArgs<any>): boolean => {
  return Boolean(user?.role === "admin" || user?.role === "ai-agent")
}
