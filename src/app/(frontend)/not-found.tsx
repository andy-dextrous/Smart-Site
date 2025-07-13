import LogomarkOutline from "@/components/logos/logomark-outline"
import { Button } from "@/components/ui/button"
import Link from "next/link"

/*************************************************************************/
/*  DEFAULT LOADING COMPONENT
/*************************************************************************/

export default function NotFound() {
  return (
    <section className="bg-dark-950 center fixed inset-0 z-50 h-screen w-screen">
      <div className="flex flex-col items-center justify-center gap-8">
        <LogomarkOutline width={200} height={330} className="w-auto" />
        <p className="text-primary text-xs font-light tracking-[0.4em] uppercase">
          Page Not Found
        </p>
        <Button asChild size="sm">
          <Link href="/">Back Home</Link>
        </Button>
      </div>
    </section>
  )
}
