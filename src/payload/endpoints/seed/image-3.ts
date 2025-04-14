import type { Media } from "@/payload/payload-types"

export const image3: Omit<Media, "createdAt" | "id" | "updatedAt"> = {
  alt: "Straight metallic shapes with an orange and blue gradient",
  caption: "<p>Straight metallic shapes with an orange and blue gradient</p>",
}
