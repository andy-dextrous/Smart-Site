"use client"

import { usePathname } from "next/navigation"
import React from "react"
import { AppSidebar } from "./app-sidebar"
import { isAuthBootstrapRoute } from "@/admin/payload/components/providers/provider-routes"
import { TopNavigation } from "./top-navigation"

/*************************************************************************/
/*  AI LAYOUT PROVIDER - CLIENT COMPONENT WITH CHAT STATE
/*************************************************************************/

export function AILayoutProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const bypassLayout = isAuthBootstrapRoute(pathname)

  return !bypassLayout ? (
    <div className="bg-admin-950 flex h-screen max-h-screen flex-col">
      <TopNavigation />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <main className="bg-admin-900 h-full flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  ) : (
    <>{children}</>
  )
}
