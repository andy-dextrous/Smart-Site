import { getCachedGlobal } from "@/lib/queries/globals"
import { CMSLink } from "@/payload/components/cms-link"
import { Logo } from "@/payload/components/logo"
import type { Footer } from "@/payload/payload-types"
import Link from "next/link"
import type { Config } from "payload"

export async function Footer() {
  const footerData: Footer = await getCachedGlobal(
    "footer" as keyof Config["globals"],
    1
  )()

  const navItems = footerData?.navItems || []

  return (
    <footer className="border-border dark:bg-card mt-auto bg-black text-white">
      <div className="container flex flex-col gap-8 py-8 md:flex-row md:justify-between">
        <Link className="flex items-center" href="/">
          <Logo />
        </Link>

        <div className="flex flex-col-reverse items-start gap-4 md:flex-row md:items-center">
          <nav className="flex flex-col gap-4 md:flex-row">
            {navItems.map(({ link }: { link: any }, i: number) => {
              return (
                <CMSLink className="text-white hover:text-white/80" key={i} {...link} />
              )
            })}
          </nav>
        </div>
      </div>
    </footer>
  )
}
