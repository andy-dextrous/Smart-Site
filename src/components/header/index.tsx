import { HeaderNav } from "@/components/header/nav"
import { getCachedGlobal } from "@/lib/queries/globals"
import type { Header } from "@/payload/payload-types"
import Image from "next/image"
import Link from "next/link"

import type { Config } from "payload"

export async function Header() {
  const headerData: Header = await getCachedGlobal(
    "header" as keyof Config["globals"],
    1
  )()

  return (
    <header className="relative z-20 container">
      <div className="flex justify-between py-8">
        <Link href="/">
          <Image src="/assets/logos/logo.svg" alt="Logo" width={200} height={50} />
        </Link>
        <HeaderNav data={headerData} />
      </div>
    </header>
  )
}
