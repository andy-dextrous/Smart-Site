import type { Post, PostsContentBlock } from "@/admin/payload/payload-types"
import type { PageData } from "@/admin/components/render-sections"
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical"

import { Section } from "@/components/fields/section"
import RichText from "@/components/fields/rich-text"
import { PostAuthorCard } from "@/components/posts/post-author-card"
import { ReadingProgress } from "@/components/posts/reading-progress"
import {
  TableOfContents,
  type TableOfContentsItem,
} from "@/components/posts/table-of-contents"
import { DocumentBreadcrumbs } from "@/components/fields/breadcrumbs"
import { cn } from "@/utilities/ui"

type ProseSize = "md" | "lg" | "xl"

const proseSizeClassMap: Record<ProseSize, string> = {
  md: "prose prose-lg max-w-none",
  lg: "prose prose-xl max-w-none",
  xl: "prose prose-2xl max-w-none",
}

function slugify(value: string, existing: Set<string>) {
  const base = value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
  let slug = base || "section"
  let counter = 1
  while (existing.has(slug)) {
    counter += 1
    slug = `${base}-${counter}`
  }
  existing.add(slug)
  return slug
}

function extractHeadings(
  content: SerializedEditorState | undefined,
  levels: Array<"h2" | "h3" | "h4"> = ["h2", "h3", "h4"]
): TableOfContentsItem[] {
  if (!content?.root?.children) return []

  const items: TableOfContentsItem[] = []
  const seen = new Set<string>()

  const walk = (node: any) => {
    if (!node) return

    if (node.type === "heading" && node.tag && levels.includes(node.tag)) {
      const text = gatherPlainText(node)
      if (text) {
        const anchorId =
          (node?.fields?.id as string | undefined) ||
          (node?.anchor as string | undefined) ||
          slugify(text, seen)
        items.push({ label: text, anchorId })
      }
    }

    if (Array.isArray(node.children)) {
      node.children.forEach(walk)
    }
  }

  content.root.children.forEach(walk)

  return items
}

function gatherPlainText(node: any): string {
  if (!node) return ""

  if (typeof node === "string") {
    return node
  }

  let text = ""

  if (node.text) {
    text += node.text
  }

  if (Array.isArray(node.children)) {
    node.children.forEach((child: any) => {
      text += gatherPlainText(child)
    })
  }

  return text.trim()
}

export const PostsContentComponent: React.FC<PostsContentBlock & PageData> = props => {
  const {
    document,
    breadcrumbs,
    showBreadcrumbs = true,
    showReadingProgress = false,
    showTableOfContents = true,
    showAuthorCard = true,
    tocHeading = "On this page",
    tocMode = "auto",
    tocItems,
    proseSize = "lg",
    sectionSettings,
  } = props

  const post = document as Post | undefined

  if (!post) {
    return null
  }

  const manualTocItems =
    tocItems
      ?.map(item => {
        if (!item?.label || !item.anchorId) return null
        return { label: item.label, anchorId: item.anchorId }
      })
      .filter((item): item is TableOfContentsItem => Boolean(item)) ?? []

  const autoTocItems =
    tocMode !== "manual"
      ? extractHeadings(post.content as SerializedEditorState | undefined)
      : []

  const tocList = showTableOfContents
    ? tocMode === "manual"
      ? manualTocItems
      : autoTocItems
    : []

  const articleId = "post-article-content"
  const proseClass = proseSizeClassMap[proseSize ?? "lg"] ?? proseSizeClassMap.lg

  return (
    <Section sectionSettings={sectionSettings} containerClassName="space-y-10">
      {showReadingProgress ? (
        <ReadingProgress targetSelector={`#${articleId}`} className="bg-neutral" />
      ) : null}

      {showBreadcrumbs && breadcrumbs ? (
        <DocumentBreadcrumbs
          document={{ breadcrumbs }}
          className="text-dark-600 text-sm"
        />
      ) : null}

      <div className="grid gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
        <article id={articleId} className={cn(proseClass, "text-dark-700 text-pretty")}>
          {post.content ? (
            <RichText
              data={post.content as SerializedEditorState}
              enableGutter={false}
              textColor="inherit"
              className="prose-h2:text-3xl prose-h3:text-2xl prose-h4:text-xl"
            />
          ) : null}
        </article>

        {showTableOfContents && tocList.length > 0 ? (
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <TableOfContents
              items={tocList}
              heading={tocHeading || undefined}
              rootSelector={`#${articleId}`}
            />
          </aside>
        ) : null}
      </div>

      {showAuthorCard ? <PostAuthorCard post={post} /> : null}
    </Section>
  )
}
