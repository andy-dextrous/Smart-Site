import type { Post } from "@/admin/payload/payload-types"

export function sampleMinimalPosts(authorRel?: any): Array<Omit<Post, "updatedAt" | "id" | "createdAt">> {
  const baseContent = (paragraphs: string[]) => ({
    root: {
      children: paragraphs.map(text => ({
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text,
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      })),
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
      content: baseContent([
        "Swap this draft with your own story once you are ready to publish.",
        "Use the hero section to introduce the article and invite readers to keep scrolling.",
        "Publish whenever you're confident the content reflects your brand voice.",
      ]),
      authors: authorRel ? [authorRel] : [],
      _status: "published",
      publishedAt: new Date().toISOString(),
    } as any,
    {
      title: "Publishing with Smart Site",
      slug: "publishing-with-smart-site",
      content: baseContent([
        "Draft posts in the CMS, preview them, then publish when satisfied.",
        "Fine-tune metadata, structured data, and featured images before going live.",
        "Revisit posts regularly to keep insights fresh and aligned with your services.",
      ]),
      authors: authorRel ? [authorRel] : [],
      _status: "published",
      publishedAt: new Date().toISOString(),
    } as any,
  ]
}
