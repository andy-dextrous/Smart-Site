"use client"

import { usePathname } from "next/navigation"
import React from "react"
import { EntityVisibilityProvider } from "@payloadcms/ui"
import type { VisibleEntities } from "payload"
import { AppSidebar } from "./app-sidebar"
import { isAuthBootstrapRoute } from "@/admin/payload/components/providers/provider-routes"
import { TopNavigation } from "./top-navigation"

/*************************************************************************/
/*  ADMIN LAYOUT PROVIDER
/*************************************************************************/

export function AdminLayoutClient({
  children,
  visibleEntities,
}: {
  children: React.ReactNode
  visibleEntities: VisibleEntities
}) {
  const pathname = usePathname()
  const bypassLayout = isAuthBootstrapRoute(pathname)

  return (
    <EntityVisibilityProvider visibleEntities={visibleEntities}>
      {!bypassLayout ? (
        <div className="bg-admin-950 flex h-screen max-h-screen flex-col">
          <TopNavigation />
          <div className="flex flex-1 overflow-hidden">
            <AppSidebar />
            <main className="bg-admin-900 h-full flex-1 overflow-y-auto">{children}</main>
          </div>
        </div>
      ) : (
        <>{children}</>
      )}
    </EntityVisibilityProvider>
  )
}
