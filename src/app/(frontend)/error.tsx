"use client"

import LogoPrimary from "@/components/logos/logo"
import { Button } from "@/components/ui/button"
import { useEffect } from "react"

/*************************************************************************/
/*  ERROR BOUNDARY COMPONENT
/*************************************************************************/

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="bg-zinc-50">
      <section className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 py-16 text-center md:py-24">
        <LogoPrimary className="h-10 w-auto" aria-hidden />
        <p className="text-primary text-xs font-medium uppercase tracking-[0.4em]">
          Something went wrong
        </p>
        <Button onClick={reset} size="sm">
          Try again
        </Button>
      </section>
    </main>
  )
}
