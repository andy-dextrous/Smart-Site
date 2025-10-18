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
import { tv } from "tailwind-variants"

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

const postsContentVariants = tv({
  slots: {
    container: "flex flex-col gap-content-lg",
    grid: "grid gap-grid-lg lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]",
    aside: "flex flex-col gap-content lg:sticky lg:top-24 lg:self-start",
    breadcrumbs: "text-sm",
    richText:
      "text-pretty text-dark-700 prose-h2:text-3xl prose-h3:text-2xl prose-h4:text-xl",
  },
  variants: {
    tone: {
      light: {
        breadcrumbs: "text-dark-600",
        richText: "text-dark-700",
      },
      neutral: {
        breadcrumbs: "text-dark-600",
        richText: "text-dark-700",
      },
      dark: {
        breadcrumbs: "text-white/80",
        richText: "text-white/80",
      },
    },
    prose: {
      md: "",
      lg: "prose-xl",
      xl: "prose-2xl",
    },
  },
  defaultVariants: {
    tone: "light",
    prose: "lg",
  },
})

export function PostsContentComponent(props: PostsContentBlock & PageData) {
  const {
    document,
    breadcrumbs,
    showBreadcrumbs,
    showReadingProgress,
    showTableOfContents,
    showAuthorCard,
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
  const tone =
    sectionSettings?.colorScheme === "dark"
      ? "dark"
      : sectionSettings?.colorScheme === "neutral"
        ? "neutral"
        : "light"

  const {
    container,
    grid,
    aside,
    breadcrumbs: breadcrumbsSlot,
    richText,
  } = postsContentVariants({
    tone,
    prose: proseSize ?? "lg",
  })

  const containerClassName = container()
  const gridClassName = grid()
  const asideClassName = aside()
  const breadcrumbsClassName = breadcrumbsSlot()
  const richTextClassName = richText()

  return (
    <Section sectionSettings={sectionSettings} containerClassName={containerClassName}>
      {showReadingProgress ? (
        <ReadingProgress targetSelector={`#${articleId}`} className="bg-neutral" />
      ) : null}

      {showBreadcrumbs !== false && breadcrumbs ? (
        <DocumentBreadcrumbs document={{ breadcrumbs }} className={breadcrumbsClassName} />
      ) : null}

      <div className={gridClassName}>
        <article id={articleId} className="text-pretty">
          {post.content ? (
            <RichText
              data={post.content as SerializedEditorState}
              enableGutter={false}
              variant="article"
              textColor="inherit"
              className={richTextClassName}
            />
          ) : null}
        </article>

        {showTableOfContents !== false && tocList.length > 0 ? (
          <aside className={asideClassName}>
            <TableOfContents
              items={tocList}
              heading={tocHeading || undefined}
              rootSelector={`#${articleId}`}
            />
          </aside>
        ) : null}
      </div>

      {showAuthorCard !== false ? <PostAuthorCard post={post} /> : null}
    </Section>
  )
}
