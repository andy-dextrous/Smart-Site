import type { Category } from "@/admin/payload/payload-types"

export const technologyCategory = (): Omit<
  Category,
  "updatedAt" | "id" | "createdAt"
> => {
  return {
    title: "Technology",
    description: "Articles about technology trends and innovation",
    breadcrumbs: [
      {
        doc: "", // Will be populated after creation
        url: "/technology",
        label: "Technology",
        id: "", // Will be generated
      },
    ],
  }
}
