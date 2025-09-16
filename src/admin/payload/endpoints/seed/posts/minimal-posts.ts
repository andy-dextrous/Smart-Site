import type { Post } from "@/admin/payload/payload-types"

export function sampleMinimalPosts(authorRel?: any): Array<
  Omit<Post, "updatedAt" | "id" | "createdAt">
> {
  const baseContent = (text: string) => ({
    root: {
      children: [
        {
          children: [
            { detail: 0, format: 0, mode: "normal", style: "", text, type: "text", version: 1 },
          ],
          direction: "ltr",
          format: "",
          indent: 0,
          type: "paragraph",
          version: 1,
        },
      ],
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  })

  return [
    {
      title: "Getting started with your blog",
      slug: "getting-started",
      content: baseContent("This is a starter post. Replace with your own content."),
      authors: authorRel ? [authorRel] : [],
      _status: "published",
      publishedAt: new Date().toISOString(),
    } as any,
    {
      title: "Writing in Smart Site",
      slug: "writing-in-smart-site",
      content: baseContent("Use the Posts collection to publish articles."),
      authors: authorRel ? [authorRel] : [],
      _status: "published",
      publishedAt: new Date().toISOString(),
    } as any,
  ]
}
