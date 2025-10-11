import LogoPrimary from "@/components/logos/logo"
import { Button } from "@/components/ui/button"
import Link from "next/link"

/*************************************************************************/
/*  DEFAULT LOADING COMPONENT
/*************************************************************************/

export default function NotFound() {
  return (
    <main className="bg-zinc-50">
      <section className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 py-16 text-center md:py-24">
        <LogoPrimary className="h-10 w-auto" aria-hidden />
        <p className="text-primary text-xs font-medium uppercase tracking-[0.4em]">
          Page Not Found
        </p>
        <Button asChild size="sm">
          <Link href="/">Back Home</Link>
        </Button>
      </section>
    </main>
  )
}
