import React from "react"
import type { Payload, PayloadRequest, TypedUser } from "payload"
import { getVisibleEntities } from "@payloadcms/ui/shared"
import { AdminLayoutClient } from "./client"

// Custom root providers sit outside Payload's page-level visibility context.
// Resolve server-only hidden functions here before serializing navigation state.
export function AdminLayoutProvider({
  children,
  payload,
  user,
}: {
  children: React.ReactNode
  payload: Payload
  user?: TypedUser
}) {
  const visibleEntities = getVisibleEntities({ req: { payload, user } as PayloadRequest })
  return (
    <AdminLayoutClient visibleEntities={visibleEntities}>{children}</AdminLayoutClient>
  )
}
