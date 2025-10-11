"use client"

import { cn } from "@/utilities/ui"
import { useEffect, useMemo, useState } from "react"

export interface TableOfContentsItem {
  label: string
  anchorId: string
}

export interface TableOfContentsProps {
  items: TableOfContentsItem[]
  heading?: string
  className?: string
  rootSelector?: string
  enableAnchorSync?: boolean
}

export function TableOfContents({
  items,
  heading = "On this page",
  className,
  rootSelector,
  enableAnchorSync = true,
}: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const observerTargets = useMemo(
    () => items.map(item => item.anchorId).filter(Boolean),
    [items]
  )

  useEffect(() => {
    if (!enableAnchorSync || !rootSelector || items.length === 0) {
      return
    }

    const root = document.querySelector<HTMLElement>(rootSelector)
    if (!root) return

    const headings = Array.from(root.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6"))

    items.forEach(item => {
      if (!item.anchorId) return

      const existing = document.getElementById(item.anchorId)
      if (existing) return

      const match = headings.find(heading => heading.textContent?.trim().toLowerCase() === item.label.trim().toLowerCase())
      if (match) {
        match.id = item.anchorId
      }
    })
  }, [enableAnchorSync, items, rootSelector])

  useEffect(() => {
    if (observerTargets.length === 0) return

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      {
        rootMargin: "-30% 0px -60% 0px",
        threshold: 0,
      }
    )

    observerTargets.forEach(anchor => {
      const element = document.getElementById(anchor)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [observerTargets])

  if (items.length === 0) {
    return null
  }

  return (
    <nav
      className={cn("rounded-2xl border border-dark-border bg-white p-6 shadow-sm", className)}
      aria-label="Table of contents"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dark-600">
        {heading}
      </p>
      <ul className="mt-4 space-y-2 text-sm text-dark-600">
        {items.map(item => (
          <li key={item.anchorId}>
            <button
              type="button"
              onClick={() => {
                const element = document.getElementById(item.anchorId)
                if (!element) return
                element.scrollIntoView({ behavior: "smooth", block: "start" })
              }}
              className={cn(
                "w-full rounded-xl px-3 py-2 text-left transition-colors hover:bg-neutral focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                activeId === item.anchorId ? "bg-neutral font-medium text-dark" : ""
              )}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
