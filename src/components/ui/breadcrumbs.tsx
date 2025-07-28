import Link from "next/link"
import { cn } from "@/utilities/ui"
import { BreadcrumbItem as BreadcrumbItemType } from "@/admin/lib/routing/uri-engine"
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

/*************************************************************************/

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
  // If no breadcrumbs provided, don't render anything
  if (!breadcrumbs || breadcrumbs.length === 0) {
    return null
  }

  // Filter out any invalid breadcrumbs
  const validBreadcrumbs = breadcrumbs.filter(crumb => crumb && crumb.label && crumb.uri)

  if (validBreadcrumbs.length === 0) {
    return null
  }

  // Add Home breadcrumb if requested and not already present
  const finalBreadcrumbs =
    showHome && !validBreadcrumbs.some(crumb => crumb.uri === "/")
      ? [{ label: "Home", uri: "/", isCurrentPage: false }, ...validBreadcrumbs]
      : validBreadcrumbs

  return (
    <Breadcrumb className={cn("mb-20", className)}>
      <BreadcrumbList className="text-sm text-white/70">
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
              <BreadcrumbSeparator className="text-white/50" />
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
