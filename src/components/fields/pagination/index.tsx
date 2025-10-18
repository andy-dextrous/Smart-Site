"use client"

import {
  Pagination as PaginationComponent,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/admin/components/ui/pagination"
import { cn } from "@/admin/utilities/ui"
import { useRouter } from "next/navigation"
import React from "react"

type PaginationColorVariant = "light" | "neutral" | "dark"

interface PaginationProps {
  className?: string
  page: number
  totalPages: number
  archiveUri?: string
  colorVariant?: PaginationColorVariant
}

function buildPaginationUrl(baseUri: string, targetPage: number): string {
  const [path, search = ""] = baseUri.split("?")
  const params = new URLSearchParams(search)

  if (targetPage <= 1) {
    params.delete("page")
  } else {
    params.set("page", String(targetPage))
  }

  const query = params.toString()
  return query ? `${path}?${query}` : path
}

const toneStyles: Record<
  PaginationColorVariant,
  { button: string; active: string; text: string }
> = {
  light: {
    button: "border border-dark-border bg-white text-dark hover:bg-neutral",
    active: "bg-dark text-white border border-dark-border",
    text: "text-dark-600",
  },
  neutral: {
    button: "border border-dark-border bg-white text-dark hover:bg-neutral",
    active: "bg-dark text-white border border-dark-border",
    text: "text-dark-600",
  },
  dark: {
    button: "border border-white/20 bg-white/10 text-white hover:bg-white/20",
    active: "bg-white text-dark border border-white",
    text: "text-white/70",
  },
}

const buttonBaseClasses =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"

/*************************************************************************/
/*  PAGINATION COMPONENT - QUERY-PARAM STRATEGY
/*************************************************************************/

export function Pagination(props: PaginationProps) {
  const {
    className,
    page,
    totalPages,
    archiveUri = "/posts",
    colorVariant = "light",
  } = props

  const router = useRouter()

  const hasPrevPage = page > 1
  const hasNextPage = page < totalPages
  const hasExtraPrevPages = page - 1 > 1
  const hasExtraNextPages = page + 1 < totalPages

  const palette = toneStyles[colorVariant] ?? toneStyles.light

  const goToPage = React.useCallback(
    (target: number) => {
      const clamped = Math.min(Math.max(target, 1), totalPages)
      router.push(buildPaginationUrl(archiveUri, clamped))
    },
    [archiveUri, router, totalPages]
  )

  return (
    <div className={cn("my-section-sm", className)}>
      <PaginationComponent>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              disabled={!hasPrevPage}
              onClick={() => goToPage(page - 1)}
              className={cn(buttonBaseClasses, palette.button)}
            />
          </PaginationItem>

          {hasExtraPrevPages ? (
            <PaginationItem>
              <PaginationEllipsis className={palette.text} />
            </PaginationItem>
          ) : null}

          {hasPrevPage ? (
            <PaginationItem>
              <PaginationLink
                onClick={() => goToPage(page - 1)}
                className={cn(buttonBaseClasses, palette.button)}
              >
                {page - 1}
              </PaginationLink>
            </PaginationItem>
          ) : null}

          <PaginationItem>
            <PaginationLink
              isActive
              onClick={() => goToPage(page)}
              className={cn(buttonBaseClasses, palette.active)}
            >
              {page}
            </PaginationLink>
          </PaginationItem>

          {hasNextPage ? (
            <PaginationItem>
              <PaginationLink
                onClick={() => goToPage(page + 1)}
                className={cn(buttonBaseClasses, palette.button)}
              >
                {page + 1}
              </PaginationLink>
            </PaginationItem>
          ) : null}

          {hasExtraNextPages ? (
            <PaginationItem>
              <PaginationEllipsis className={palette.text} />
            </PaginationItem>
          ) : null}

          <PaginationItem>
            <PaginationNext
              disabled={!hasNextPage}
              onClick={() => goToPage(page + 1)}
              className={cn(buttonBaseClasses, palette.button)}
            />
          </PaginationItem>
        </PaginationContent>
      </PaginationComponent>
    </div>
  )
}
