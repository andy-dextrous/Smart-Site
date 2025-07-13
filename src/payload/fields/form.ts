import deepMerge from "@/utilities/deep-merge"
import type { Field } from "payload"
import { getFormVariantOptions, createDefaultForm } from "@/utilities/form-variants"

/*************************************************************************/
/*  GET FORM VARIANT OPTIONS
/*************************************************************************/

const { variantOptions } = getFormVariantOptions()

/*************************************************************************/
/*  FORM WITH VARIANT FIELD
/*************************************************************************/

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
            width: "70%",
          },
        },
        {
          name: "variant",
          type: "select",
          label: "Form Variant",
          defaultValue: "white",
          options: variantOptions,
          admin: {
            description: "Visual style based on background",
            width: "30%",
          },
        },
      ],
    },
    overrides
  )
}
