import { createRichText, paragraph } from "@/admin/utilities/rich-text-builder"

export function insightsMinimalPage() {
  return {
    title: "Insights",
    slug: "insights",
    _status: "published",
    sections: [
      {
        blockType: "hero",
        heading: "Insights",
        supportingText: "Latest articles and updates from your team.",
        alignment: "left",
        size: "medium",
        sectionSettings: {
          containerWidth: "lg",
          colorScheme: "neutral",
        },
      },
      {
        blockType: "posts-archive",
        postsPerPage: 6,
        layout: "grid",
        columns: "three",
        showExcerpt: true,
        showCategories: true,
        showPublishedDate: true,
        showPagination: true,
        showPageRange: true,
        sectionSettings: {
          containerWidth: "lg",
          colorScheme: "light",
        },
      },
    ],
    publishedAt: new Date().toISOString(),
  }
}
