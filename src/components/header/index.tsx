import { HeaderNavigation } from "@/components/header/nav"
import { getGlobal, getSettings } from "@/admin/data/globals"
import type { Header, Setting } from "@/admin/payload/payload-types"
import Link from "next/link"

import type { Config } from "payload"
import LogoPrimary from "../logos/logo"
import { MobileNavUpdated } from "./mobile-nav"
import { getCurrentUser } from "@/admin/data/user"
import { cn } from "@/utilities/ui"

export async function Header() {
  const [headerData, settingsData, user] = await Promise.all([
    getGlobal("header" as keyof Config["globals"], 1),
    getSettings(),
    getCurrentUser(),
  ])

  const settings = settingsData as Setting

  return (
    <header
      className={cn(
        "h-nav md:px-section-x bg-white fixed inset-x-0 z-[1000] border-b border-zinc-200 px-0",
        // If user is logged in, add 32px to the top of the header to accomodate the admin bar
        user ? "top-[32px]" : "top-0"
      )}
    >
      <div className="h-full px-8">
        <div className="flex h-full items-center justify-between">
          <Link
            href="/"
            className="flex items-center space-x-3"
            aria-label="Return to homepage"
          >
            <LogoPrimary width={160} height={42} />
          </Link>
          <HeaderNavigation data={headerData} />
          <MobileNavUpdated data={headerData} settings={settings} />
        </div>
      </div>
    </header>
  )
}
