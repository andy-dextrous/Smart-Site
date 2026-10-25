"use client"

import { cn } from "@/lib/ui"
import { useEffect, useState } from "react"

export interface ReadingProgressProps {
  targetSelector?: string
  className?: string
}

export function ReadingProgress({
  targetSelector = "article",
  className,
}: ReadingProgressProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const target = document.querySelector<HTMLElement>(targetSelector) ?? document.body

    if (!target) return

    function handleScroll() {
      const rect = target.getBoundingClientRect()
      const viewHeight = window.innerHeight || document.documentElement.clientHeight

      const totalHeight = target.scrollHeight - viewHeight
      const scrolled = Math.min(Math.max(-rect.top, 0), totalHeight)
      const percent = totalHeight > 0 ? scrolled / totalHeight : 0

      setProgress(percent)
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", handleScroll)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleScroll)
    }
  }, [targetSelector])

  return (
    <div
      className={cn("relative h-1 w-full overflow-hidden rounded-full bg-neutral", className)}
      role="presentation"
      aria-hidden="true"
    >
      <div
        className="h-full w-full origin-left scale-x-0 rounded-full bg-dark transition-transform duration-150 ease-out"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  )
}
