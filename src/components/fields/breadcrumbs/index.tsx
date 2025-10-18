import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { ChevronRight, MoreHorizontal } from "lucide-react"
import Link from "next/link"

import { BreadcrumbItem as BreadcrumbItemType } from "@/admin/routing/uri-engine"
import { getSmartSiteConfig } from "@/admin/config"
import { cn } from "@/utilities/ui"

export function Breadcrumb(props: React.ComponentProps<"nav">) {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />
}

export function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "text-dark-600 flex flex-wrap items-center gap-content-xs text-sm break-words sm:gap-content-sm",
        className
      )}
      {...props}
    />
  )
}

export function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex items-center gap-content-xs", className)}
      {...props}
    />
  )
}

export function BreadcrumbLink({
  asChild,
  className,
  ...props
}: React.ComponentProps<"a"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      data-slot="breadcrumb-link"
      className={cn("hover:text-dark transition-colors", className)}
      {...props}
    />
  )
}

export function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("text-dark", className)}
      {...props}
    />
  )
}

export function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn("[&>svg]:size-3.5", className)}
      {...props}
    >
      {children ?? <ChevronRight />}
    </li>
  )
}

export function BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">More</span>
    </span>
  )
}

const config = getSmartSiteConfig()
const breadcrumbConfig = config.breadcrumbs

const separators = {
  slash: "/",
  chevron: ">",
  arrow: "→",
  dot: "•",
}

interface BreadcrumbsProps {
  breadcrumbs?: BreadcrumbItemType[]
  className?: string
  showHome?: boolean
}

export function Breadcrumbs({
  breadcrumbs = [],
  className,
  showHome = true,
}: BreadcrumbsProps) {
  if (!breadcrumbConfig.enabled) {
    return null
  }

  if (!breadcrumbs || breadcrumbs.length === 0) {
    return null
  }

  const validBreadcrumbs = breadcrumbs.filter(crumb => crumb && crumb.label && crumb.uri)

  if (validBreadcrumbs.length === 0) {
    return null
  }

  const depthLimitedBreadcrumbs =
    breadcrumbConfig.maxDepth && breadcrumbConfig.maxDepth > 0
      ? validBreadcrumbs.slice(-breadcrumbConfig.maxDepth)
      : validBreadcrumbs

  const processedBreadcrumbs = breadcrumbConfig.showCurrent
    ? depthLimitedBreadcrumbs
    : depthLimitedBreadcrumbs.filter(crumb => !crumb.isCurrentPage)

  const finalBreadcrumbs =
    showHome && !processedBreadcrumbs.some(crumb => crumb.uri === "/")
      ? [{ label: breadcrumbConfig.homeLabel, uri: "/", isCurrentPage: false }, ...processedBreadcrumbs]
      : processedBreadcrumbs

  return (
    <Breadcrumb className={cn("mb-content-lg", breadcrumbConfig.className, className)}>
      <BreadcrumbList className={cn("text-sm text-dark-600", breadcrumbConfig.className)}>
        {finalBreadcrumbs.map((crumb, index) => (
          <div key={`${crumb.uri}-${index}`} className="flex items-center gap-content-xs">
            <BreadcrumbItem>
              {crumb.isCurrentPage ? (
                <BreadcrumbPage className="text-dark">{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={crumb.uri} className="text-sm text-dark-600 hover:text-dark">
                    {crumb.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < finalBreadcrumbs.length - 1 && (
              <BreadcrumbSeparator className="text-dark-600">
                {separators[breadcrumbConfig.separator]}
              </BreadcrumbSeparator>
            )}
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

interface DocumentBreadcrumbsProps {
  document?: {
    breadcrumbs?: BreadcrumbItemType[]
  }
  className?: string
  showHome?: boolean
}

export function DocumentBreadcrumbs({
  document,
  className,
  showHome = true,
}: DocumentBreadcrumbsProps) {
  return (
    <Breadcrumbs
      breadcrumbs={document?.breadcrumbs}
      className={className}
      showHome={showHome}
    />
  )
}
