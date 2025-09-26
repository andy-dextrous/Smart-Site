import { createRichText, paragraph } from "@/admin/utilities/rich-text-builder"

export function insightsMinimalPage() {
  return {
    title: "Insights",
    slug: "insights",
    _status: "published",
    sections: [
      {
        blockType: "hero-simple",
        heading: "Insights",
        content: createRichText([paragraph("Latest articles and updates from your team.")]),
        align: "center",
      },
      { blockType: "posts-list", postsPerPage: 6 },
    ],
    publishedAt: new Date().toISOString(),
  }
}
