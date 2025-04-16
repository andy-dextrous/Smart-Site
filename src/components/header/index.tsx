import { HeaderNavigation } from "@/components/header/nav"
import { getCachedGlobal } from "@/lib/queries/globals"
import type { Header } from "@/payload/payload-types"
import Image from "next/image"
import Link from "next/link"

import type { Config } from "payload"
import { MobileNav } from "./mobile-nav"

export async function Header() {
  const headerData: Header = await getCachedGlobal(
    "header" as keyof Config["globals"],
    1
  )()

  return (
    <header className="logo-height relative z-20 h-(--nav-height) border-b border-gray-100 bg-white px-(--section-padding-x)">
      <div className="container h-full">
        <div className="flex h-full items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <Image src="/assets/logos/logo.svg" alt="Logo" width={160} height={40} />
          </Link>
          <HeaderNavigation data={headerData} />
          <MobileNav data={headerData} />
        </div>
      </div>
    </header>
  )
}
