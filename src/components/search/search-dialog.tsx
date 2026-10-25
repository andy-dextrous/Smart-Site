"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { SearchIcon, ExternalLink } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

type SearchMode = "page" | "modal" | "hybrid"

type TriggerVariant = "icon" | "list" | "button"

interface SearchCommandLauncherProps {
  mode: SearchMode
  variant: TriggerVariant
  className?: string
  onNavigate?: () => void
}

interface SearchResult {
  id: string
  title: string
  description: string | null
  href: string
  collection: string
  collectionLabel: string
  slug: string | null
  categories: Array<{ id: string; title: string | null }>
}

interface SearchApiResponse {
  items: SearchResult[]
  page: number
  total: number
  totalPages: number
  query: string
  hasQuery: boolean
  enabled: boolean
}

const QUERY_MIN_LENGTH = 2
const HYBRID_LIMIT = 30
const MODAL_LIMIT = 20

function normalizeText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

function computeMatchScore(query: string, candidate: string | null | undefined): number {
  if (!candidate) {
    return 0
  }

  const normalizedQuery = normalizeText(query)
  const normalizedCandidate = normalizeText(candidate)

  if (!normalizedQuery || !normalizedCandidate) {
    return 0
  }

  if (normalizedCandidate === normalizedQuery) {
    return 120
  }

  if (normalizedCandidate.startsWith(normalizedQuery)) {
    return 110
  }

  if (normalizedCandidate.includes(normalizedQuery)) {
    return 95
  }

  const querySegments = normalizedQuery.split(" ")
  const candidateSegments = normalizedCandidate.split(/[\s/-]+/)

  let segmentScore = 0
  querySegments.forEach(segment => {
    if (!segment) {
      return
    }

    const exact = candidateSegments.some(value => value === segment)
    if (exact) {
      segmentScore += 25
      return
    }

    const startsWith = candidateSegments.some(value => value.startsWith(segment))
    if (startsWith) {
      segmentScore += 20
      return
    }

    const contains = candidateSegments.some(value => value.includes(segment))
    if (contains) {
      segmentScore += 10
    }
  })

  return segmentScore
}

function scoreResult(query: string, result: SearchResult): number {
  const titleScore = computeMatchScore(query, result.title)
  const descriptionScore = computeMatchScore(query, result.description)
  const slugScore = computeMatchScore(query, result.slug)
  const categoryScore = Math.max(
    ...result.categories.map(category => computeMatchScore(query, category.title || "")),
    0
  )

  return titleScore * 2 + descriptionScore + slugScore + categoryScore
}

function rankResults(query: string, items: SearchResult[]): SearchResult[] {
  if (!query) {
    return items
  }

  const scored = items.map(item => {
    return {
      item,
      score: scoreResult(query, item),
    }
  })

  scored.sort((a, b) => b.score - a.score)

  return scored.map(entry => entry.item)
}

function groupResults(items: SearchResult[]): Array<[string, SearchResult[]]> {
  const groups = new Map<string, SearchResult[]>()

  items.forEach(item => {
    const existing = groups.get(item.collectionLabel)
    if (existing) {
      existing.push(item)
    } else {
      groups.set(item.collectionLabel, [item])
    }
  })

  return Array.from(groups.entries())
}

export function SearchCommandLauncher(props: SearchCommandLauncherProps) {
  const { mode, variant, className, onNavigate } = props
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [loading, setLoading] = React.useState(false)
  const [hasQuery, setHasQuery] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const activeLimit = mode === "hybrid" ? HYBRID_LIMIT : MODAL_LIMIT
  const [lastFetchedQuery, setLastFetchedQuery] = React.useState("")

  const changeQuery = React.useCallback((next: string) => {
    setQuery(next)
    if (normalizeText(next).length < QUERY_MIN_LENGTH) {
      setHasQuery(false); setResults([]); setLastFetchedQuery(""); setLoading(false); setError(null)
    }
  }, [])
  const handleOpenChange = React.useCallback((nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) changeQuery("")
  }, [changeQuery])

  React.useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        handleOpenChange(!open)
      }
    }

    window.addEventListener("keydown", handleKey)
    return () => {
      window.removeEventListener("keydown", handleKey)
    }
  }, [open, handleOpenChange])

  React.useEffect(() => {
    if (!open) {
      return
    }

    if (normalizeText(query).length < QUERY_MIN_LENGTH) return

    const controller = new AbortController()
    const signal = controller.signal

    async function run() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=${activeLimit}`, {
          method: "GET",
          signal,
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error(`Search failed with status ${response.status}`)
        }

        const data = (await response.json()) as SearchApiResponse
        const items = Array.isArray(data.items) ? data.items.filter(Boolean) : []

        setLastFetchedQuery(data.query ?? "")
        setHasQuery(Boolean(data.hasQuery))

        if (data.hasQuery) {
          const ranked = rankResults(query, items)
          setResults(ranked)
        } else {
          setResults([])
        }
      } catch (err) {
        if ((err as any)?.name === "AbortError") {
          return
        }

        setError(err instanceof Error ? err.message : "Unable to load results")
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    run()

    return () => {
      controller.abort()
    }
  }, [query, activeLimit, open])

  const showModal = mode === "modal" || mode === "hybrid"

  const handleSelect = React.useCallback(
    (href: string) => {
      handleOpenChange(false)
      onNavigate?.()
      router.push(href)
    },
    [router, onNavigate, handleOpenChange]
  )

  const groupedResults = React.useMemo(() => {
    return groupResults(results).filter(([, items]) => items && items.length > 0)
  }, [results])

  function renderTrigger() {
    if (!showModal) {
      if (variant === "icon") {
        return (
          <Link
            href="/search"
            className={className}
            onClick={onNavigate}
            aria-label="Search"
          >
            <SearchIcon className="text-dark-600 h-4 w-4" />
          </Link>
        )
      }

      return (
        <Link href="/search" className={className} onClick={onNavigate}>
          Search
        </Link>
      )
    }

    const openModal = () => {
      handleOpenChange(true)
    }

    if (variant === "icon") {
      return (
        <button
          type="button"
          onClick={openModal}
          className={className}
          aria-label="Search"
        >
          <SearchIcon className="text-dark-600 h-4 w-4" />
        </button>
      )
    }

    if (variant === "button") {
      return (
        <button type="button" onClick={openModal} className={className}>
          Search
        </button>
      )
    }

    return (
      <button type="button" onClick={openModal} className={className}>
        Search
      </button>
    )
  }

  return (
    <>
      {renderTrigger()}
      {showModal && open ? (
        <CommandDialog
          open={open}
          onOpenChange={handleOpenChange}
          className="max-w-xl"
          commandProps={{ shouldFilter: false }}
        >
          <CommandInput
            value={query}
            onValueChange={changeQuery}
            placeholder="Search pages and posts"
            autoFocus
          />
          <CommandList>
            <CommandEmpty>
              {loading
                ? "Searching…"
                : error
                  ? error
                  : hasQuery && lastFetchedQuery === query && results.length === 0
                    ? "No results. Try another keyword."
                    : "Enter at least two characters to search."}
            </CommandEmpty>
            {groupedResults.map(([label, items]) => {
              return (
                <CommandGroup heading={label} key={label}>
                  {items.map(item => {
                    const itemValue =
                      [item.collectionLabel, item.title, item.slug, item.href]
                        .filter(Boolean)
                        .join(" ") || item.id

                    return (
                      <CommandItem
                        key={item.id}
                        value={itemValue}
                        onSelect={() => handleSelect(item.href)}
                      >
                        <div className="flex flex-col gap-content-xs">
                          <span className="font-medium text-dark">{item.title}</span>
                          <span className="text-xs text-dark-600">{item.href}</span>
                          {item.description ? (
                            <span className="text-xs text-dark-600 line-clamp-2">{item.description}</span>
                          ) : null}
                        </div>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )
            })}
            {mode === "hybrid" && hasQuery ? (
              <>
                <CommandSeparator />
                <CommandGroup heading="Open full results">
                  <CommandItem
                    value={`open full results ${query}`.trim() || `open full results`}
                    onSelect={() => handleSelect(`/search?q=${encodeURIComponent(query)}`)}
                  >
                    <div className="flex items-center gap-content-sm">
                      <span>View all results</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </div>
                  </CommandItem>
                </CommandGroup>
              </>
            ) : null}
          </CommandList>
        </CommandDialog>
      ) : null}
    </>
  )
}
