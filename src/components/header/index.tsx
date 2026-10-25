import { HeaderNavigation } from "@/components/header/nav"
import { getGlobal, getSettings } from "@/website/data/globals"
import type { Header, Setting } from "@/payload-types"
import Link from "next/link"

import type { Config } from "payload"
import LogoPrimary from "@/components/logos/logo"
import { MobileNavUpdated } from "@/components/header/mobile-nav"
import { cn } from "@/utilities/ui"
import { getSearchConfig } from "@/website/features"

export async function Header() {
  const [headerData, settingsData] = await Promise.all([
    getGlobal("header" as keyof Config["globals"], 1),
    getSettings(),
  ])

  const settings = settingsData as Setting
  const searchConfig = getSearchConfig()

  return (
    <header
      className={cn(
        "smartsite-header h-nav min-h-nav max-h-nav border-dark-border px-section-x fixed inset-x-0 top-0 z-[1000] border-b bg-white"
      )}
    >
      <div className="max-w-container gap-content mx-auto flex h-full w-full items-center justify-between">
        <Link
          href="/"
          className="gap-content-sm flex items-center"
          aria-label="Return to homepage"
        >
          <LogoPrimary className="h-logo w-auto" />
        </Link>
        <HeaderNavigation data={headerData} search={searchConfig} />
        <MobileNavUpdated data={headerData} settings={settings} search={searchConfig} />
      </div>
    </header>
  )
}
