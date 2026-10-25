"use client"

import { ExternalLink, Moon, Sun, Sparkles } from "lucide-react"
import React from "react"
import { Button } from "@/components/cms-ui/button"
import { useTheme } from "@payloadcms/ui"
import UserDropdown from "@/admin/providers/layout-provider/user-dropdown"
import Link from "next/link"

/*************************************************************************/
/*  TOP NAVIGATION WITH CHAT TOGGLE
/*************************************************************************/

export function TopNavigation() {
  const { theme, setTheme } = useTheme()

  /*************************************************************************/
  /*  THEME TOGGLE HANDLER
  /*************************************************************************/

  function handleThemeToggle() {
    setTheme(theme === "light" ? "dark" : "light")
  }

  return (
    <nav className="bg-admin-50 border-admin-200 dark:bg-admin-950 dark:border-admin-800 h-nav flex items-center justify-between border-b px-6">
      <Link
        href="/admin"
        className="text-admin-900 dark:text-admin-50 flex items-center gap-2 font-semibold"
      >
        <Sparkles className="text-admin-accent h-6 w-6" />
        <span className="text-lg">Smart Site Admin</span>
      </Link>

      <div className="flex items-center gap-3">
        <Button asChild variant="secondary" size="lg">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <ExternalLink />
            <span>View Site</span>
          </Link>
        </Button>

        <Button size="icon-round" onClick={handleThemeToggle}>
          {theme === "light" ? <Moon /> : <Sun />}
        </Button>

        <UserDropdown />
      </div>
    </nav>
  )
}
