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
      title: "Welcome to your new blog",
      slug: "welcome-to-your-new-blog",
      content: baseContent("Swap this draft with your own story once you are ready to publish."),
      authors: authorRel ? [authorRel] : [],
      _status: "published",
      publishedAt: new Date().toISOString(),
    } as any,
    {
      title: "Publishing with Smart Site",
      slug: "publishing-with-smart-site",
      content: baseContent("Draft posts in the CMS, preview them, then publish when satisfied."),
      authors: authorRel ? [authorRel] : [],
      _status: "published",
      publishedAt: new Date().toISOString(),
    } as any,
  ]
}
