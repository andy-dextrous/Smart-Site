import type { CollectionConfig } from "payload"
import { generatePreviewPath } from "@/lib/generate-preview-path"
export function websitePreview(
  collection: string
): Pick<NonNullable<CollectionConfig["admin"]>, "preview" | "livePreview"> {
  return {
    preview: (data, { req }) =>
      generatePreviewPath({
        collection: collection as any,
        slug: typeof data?.slug === "string" ? data.slug : "",
        req,
        data,
      }),
    livePreview: {
      url: ({ data, req }) =>
        `${generatePreviewPath({ collection: collection as any, slug: typeof data?.slug === "string" ? data.slug : "", req, data })}&livePreview=true`,
    },
  }
}
