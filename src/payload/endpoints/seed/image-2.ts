import type { Media } from "@/payload/payload-types"

export const image2: Omit<Media, "createdAt" | "id" | "updatedAt"> = {
  alt: "Curving abstract shapes with an orange and blue gradient",
  caption: "<p>Curving abstract shapes with an orange and blue gradient</p>",
}
