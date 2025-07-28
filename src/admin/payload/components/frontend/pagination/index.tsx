"use client"

import {
  Pagination as PaginationComponent,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/admin/payload/components/ui/pagination"
import { cn } from "@/admin/utilities/ui"
import { useRouter } from "next/navigation"
import React from "react"

/*************************************************************************/
/*  PAGINATION COMPONENT - URI-FIRST ARCHITECTURE
/*************************************************************************/

export const Pagination: React.FC<{
  className?: string
  page: number
  totalPages: number
  archiveUri?: string // Archive page URI passed from parent component
}> = props => {
  const router = useRouter()

  const { className, page, totalPages, archiveUri = "/insights" } = props
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  const hasExtraPrevPages = page - 1 > 1
  const hasExtraNextPages = page + 1 < totalPages

  // Generate pagination URL
  const getPaginationUrl = (pageNumber: number): string => {
    return `${archiveUri}/page/${pageNumber}`
  }

  return (
    <div className={cn("my-12", className)}>
      <PaginationComponent>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              size="sm"
              disabled={!hasPrevPage}
              onClick={() => {
                router.push(getPaginationUrl(page - 1))
              }}
            />
          </PaginationItem>

          {hasExtraPrevPages && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          {hasPrevPage && (
            <PaginationItem>
              <PaginationLink
                size="sm"
                onClick={() => {
                  router.push(getPaginationUrl(page - 1))
                }}
              >
                {page - 1}
              </PaginationLink>
            </PaginationItem>
          )}

          <PaginationItem>
            <PaginationLink
              isActive
              size="sm"
              onClick={() => {
                router.push(getPaginationUrl(page))
              }}
            >
              {page}
            </PaginationLink>
          </PaginationItem>

          {hasNextPage && (
            <PaginationItem>
              <PaginationLink
                size="sm"
                onClick={() => {
                  router.push(getPaginationUrl(page + 1))
                }}
              >
                {page + 1}
              </PaginationLink>
            </PaginationItem>
          )}

          {hasExtraNextPages && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          <PaginationItem>
            <PaginationNext
              size="sm"
              disabled={!hasNextPage}
              onClick={() => {
                router.push(getPaginationUrl(page + 1))
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </PaginationComponent>
    </div>
  )
}
