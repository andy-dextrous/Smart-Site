import type { Post } from "@/admin/payload/payload-types"
import type { BreadcrumbItem } from "@/admin/routing/uri-engine"
import RichText from "@/components/fields/rich-text"
import { DocumentBreadcrumbs } from "@/components/ui/breadcrumbs"

/*************************************************************************/
/*  POST CONTENT (MINIMAL) - SECTION
/*************************************************************************/

interface PostContentMinimalProps {
  document?: Post & {
    breadcrumbs?: BreadcrumbItem[]
  }
}

export function PostContentMinimalComponent({ document }: PostContentMinimalProps) {
  if (!document || !document.content) {
    return null
  }

  return (
    <section className="bg-white">
      <div className="container-sm py-12">
        <div className="mx-auto max-w-3xl">
          <DocumentBreadcrumbs
            document={document}
            className="mb-8 [&_[data-slot='breadcrumb-list']]:!text-zinc-500 [&_[data-slot='breadcrumb-link']]:!text-zinc-500 [&_[data-slot='breadcrumb-link']]:hover:!text-zinc-700 [&_[data-slot='breadcrumb-page']]:!text-zinc-900 [&_[data-slot='breadcrumb-separator']]:!text-zinc-300"
          />
          <RichText data={document.content} variant="prose" className="mt-8" />
        </div>
      </div>
    </section>
  )
}
