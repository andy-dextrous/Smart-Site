import Link from "next/link"
import { cn } from "@/utilities/ui"
import { BreadcrumbItem as BreadcrumbItemType } from "@/admin/routing/uri-engine"
import { getSmartSiteConfig } from "@/admin/config"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

/*************************************************************************/
/*  UNIVERSAL BREADCRUMBS COMPONENT

    Consumes pre-computed breadcrumbs from the URI index and renders
    a universal breadcrumb navigation that works across all collections.

    FEATURES:
    - Uses pre-computed breadcrumbs from document.breadcrumbs
    - Works universally for pages, posts, and all collection items
    - Handles edge cases like empty breadcrumbs or missing URIs
    - Maintains consistent styling with existing breadcrumb patterns
    - Always includes Home link as the root breadcrumb
    - Configurable via smartsite.config.ts breadcrumbs settings

/*************************************************************************/

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
  // Check if breadcrumbs are enabled in config
  if (!breadcrumbConfig.enabled) {
    return null
  }

  // If no breadcrumbs provided, don't render anything
  if (!breadcrumbs || breadcrumbs.length === 0) {
    return null
  }

  // Filter out any invalid breadcrumbs
  const validBreadcrumbs = breadcrumbs.filter(crumb => crumb && crumb.label && crumb.uri)

  if (validBreadcrumbs.length === 0) {
    return null
  }

  // Apply max depth if configured
  const depthLimitedBreadcrumbs = breadcrumbConfig.maxDepth && breadcrumbConfig.maxDepth > 0
    ? validBreadcrumbs.slice(-breadcrumbConfig.maxDepth)
    : validBreadcrumbs

  // Filter out current page if configured
  const processedBreadcrumbs = breadcrumbConfig.showCurrent
    ? depthLimitedBreadcrumbs
    : depthLimitedBreadcrumbs.filter(crumb => !crumb.isCurrentPage)

  // Add Home breadcrumb if requested and not already present
  const finalBreadcrumbs =
    showHome && !processedBreadcrumbs.some(crumb => crumb.uri === "/")
      ? [{ label: breadcrumbConfig.homeLabel, uri: "/", isCurrentPage: false }, ...processedBreadcrumbs]
      : processedBreadcrumbs

  return (
    <Breadcrumb className={cn("mb-20", breadcrumbConfig.className, className)}>
      <BreadcrumbList className={cn("text-sm text-white/70", breadcrumbConfig.className)}>
        {finalBreadcrumbs.map((crumb, index) => (
          <div key={`${crumb.uri}-${index}`} className="flex items-center">
            <BreadcrumbItem>
              {crumb.isCurrentPage ? (
                <BreadcrumbPage className="!text-light text-sm text-white">
                  {crumb.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link
                    href={crumb.uri}
                    className="text-sm text-white hover:text-white/80"
                  >
                    {crumb.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < finalBreadcrumbs.length - 1 && (
              <BreadcrumbSeparator className="text-white/50">
                {separators[breadcrumbConfig.separator]}
              </BreadcrumbSeparator>
            )}
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

/*************************************************************************/
/*  DOCUMENT BREADCRUMBS COMPONENT

    Convenience component that extracts breadcrumbs from a document
    and renders them using the universal Breadcrumbs component.

/*************************************************************************/

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
