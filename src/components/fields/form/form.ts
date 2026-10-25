import deepMerge from "@/lib/deep-merge"
import type { Field } from "payload"

export const formVariant = (overrides: Partial<Field> = {}): Field => {
  return deepMerge(
    {
      type: "row",
      fields: [
        {
          name: "form",
          type: "relationship",
          relationTo: "forms",
          required: true,
          admin: {
            description: "Select the form to display",
            width: "100%",
          },
        },
      ],
    },
    overrides
  )
}
