import { Post } from "@/admin/payload/payload-types"
import { cn } from "@/utilities/ui"
import { DocumentBreadcrumbs } from "@/components/ui/breadcrumbs"
import { BreadcrumbItem } from "@/admin/routing/uri-engine"

/*************************************************************************/
/*  POST BREADCRUMBS COMPONENT

    Updated to use the universal breadcrumbs system with pre-computed
    breadcrumbs from the URI index instead of hardcoded breadcrumbs.

/*************************************************************************/

interface PostBreadcrumbsProps {
  post: Post & {
    breadcrumbs?: BreadcrumbItem[]
  }
  className?: string
  showHome?: boolean
}

export function PostBreadcrumbs({
  post,
  className,
  showHome = true,
}: PostBreadcrumbsProps) {
  return <DocumentBreadcrumbs document={post} className={className} showHome={showHome} />
}
