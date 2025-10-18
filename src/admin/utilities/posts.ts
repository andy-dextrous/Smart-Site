import type { Post } from "@/admin/payload/payload-types"

export function resolvePostCategories(post: Post): string[] {
  const categories = post.categories || []

  return categories
    .map(category => {
      if (typeof category === "object" && category !== null) {
        return "title" in category ? category.title : null
      }
      return null
    })
    .filter((value): value is string => Boolean(value))
}

export function formatPostPublishDate(value: string | null | undefined): string | null {
  if (!value) return null

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null

  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export function estimatePostReadingTime(content: Post["content"]): number | null {
  if (!content?.root?.children) return null

  let wordCount = 0

  const walk = (node: any) => {
    if (!node) return

    if (typeof node === "string") {
      wordCount += node.trim().split(/\s+/).filter(Boolean).length
      return
    }

    if (node.text) {
      wordCount += node.text.trim().split(/\s+/).filter(Boolean).length
    }

    if (Array.isArray(node.children)) {
      node.children.forEach(walk)
    }
  }

  content.root.children.forEach(walk)

  if (wordCount === 0) return null

  const wordsPerMinute = 200
  return Math.max(1, Math.round(wordCount / wordsPerMinute))
}
