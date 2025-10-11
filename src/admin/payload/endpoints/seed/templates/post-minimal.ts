import type { Payload } from "payload"

export async function postMinimalTemplate(payload: Payload, context?: any): Promise<string | null> {
  try {
    const template = await payload.create({
      collection: "templates",
      data: ({
        name: "Post - Minimal",
        description: "Minimal post template",
        sections: [
          {
            blockType: "posts-hero",
            showAuthor: true,
            showPublishDate: true,
            showCategories: true,
            showReadingTime: true,
            showFeaturedImage: true,
            sectionSettings: {
              colorScheme: "neutral",
            },
          },
          {
            blockType: "posts-content",
            showBreadcrumbs: true,
            showTableOfContents: true,
            showAuthorCard: true,
            showReadingProgress: false,
            proseSize: "lg",
            sectionSettings: {
              colorScheme: "light",
            },
          },
          {
            blockType: "posts-related",
            heading: "Related Posts",
            maxPosts: 3,
            sectionSettings: {
              colorScheme: "light",
            },
          },
        ],
      } as any),
      context,
    })
    return template.id as string
  } catch (e) {
    payload.logger.warn("Failed to create minimal post template:", e)
    return null
  }
}
