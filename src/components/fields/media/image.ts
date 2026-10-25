import deepMerge from "@/utilities/deep-merge"
import type { Field } from "payload"

export const backgroundImage = (overrides: Partial<Field> = {}): Field => {
  return deepMerge(
    {
      name: "backgroundImage",
      type: "upload",
      relationTo: "media",
      filterOptions: {
        mimeType: { contains: "image" },
      },
      admin: {
        description: "Optional background image for the hero section",
      },
    },
    overrides
  )
}

export const image = (overrides: Partial<Field> = {}): Field => {
  return deepMerge(
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      filterOptions: {
        mimeType: { contains: "image" },
      },
    },
    overrides
  )
}

export const imagePosition = (overrides: Partial<Field> = {}): Field => {
  return deepMerge(
    {
      name: "imagePosition",
      type: "select",
      options: ["left", "right"],
      defaultValue: "left",
    },
    overrides
  )
}
