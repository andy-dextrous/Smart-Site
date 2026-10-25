import type { Field } from "payload"

/*************************************************************************/
/*  ICON UPLOAD FIELD FACTORY
/*************************************************************************/

interface IconPickerFieldOptions {
  name: string
  label?: string
  required?: boolean
  adminDescription?: string
  adminWidth?: string
}

/**
 * Generates a SVG-only upload field that mirrors the Aurora card icon behaviour.
 */
export function iconPickerField({
  name,
  label = "Icon",
  required = false,
  adminDescription = "Upload an SVG icon to display above the card title.",
  adminWidth = "50%",
}: IconPickerFieldOptions): Field {
  return {
    name,
    label,
    type: "upload",
    relationTo: "media",
    required,
    filterOptions: {
      mimeType: { contains: "svg" },
    },
    admin: {
      width: adminWidth,
      description: adminDescription,
    },
  }
}
