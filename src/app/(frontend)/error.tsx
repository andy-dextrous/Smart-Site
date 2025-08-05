"use client"

import LogomarkOutline from "@/components/logos/logomark-outline"
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
    <section className="bg-dark-950 center fixed inset-0 z-50 h-screen w-screen">
      <div className="flex flex-col items-center justify-center gap-8">
        <LogomarkOutline width={200} height={330} className="w-auto" />
        <p className="text-primary text-xs font-light tracking-[0.4em] uppercase">
          Something went wrong
        </p>
        <Button onClick={reset} size="sm">
          Try again
        </Button>
      </div>
    </section>
  )
}