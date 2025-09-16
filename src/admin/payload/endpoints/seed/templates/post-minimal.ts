import type { Payload } from "payload"

export async function postMinimalTemplate(payload: Payload, context?: any): Promise<string | null> {
  try {
    const template = await payload.create({
      collection: "templates",
      data: ({
        name: "Post - Minimal",
        description: "Minimal post template",
        sections: [
          { blockType: "post-hero-minimal", showAuthor: true, showPublishDate: true, showCategories: true },
          { blockType: "post-content-minimal" },
          { blockType: "related-posts-minimal", heading: "Related Posts", maxPosts: 3 },
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
