import type { CheckboxField, TextField } from "payload"
import { formatSlugHook } from "./format-slug"

type Overrides = {
  slugOverrides?: Partial<TextField>
  uriOverrides?: Partial<TextField>
  checkboxOverrides?: Partial<CheckboxField>
}

type Slug = (
  fieldToUse?: string,
  overrides?: Overrides
) => [TextField, TextField, CheckboxField]

/*************************************************************************/
/*  SLUG FIELD
/*************************************************************************/

export const slugField: Slug = (fieldToUse = "title", overrides = {}) => {
  const { slugOverrides, uriOverrides, checkboxOverrides } = overrides

  /**
   *  CHECKBOX FIELD
   */

  const checkBoxField: CheckboxField = {
    name: "slugLock",
    type: "checkbox",
    defaultValue: false,
    admin: {
      hidden: true,
      position: "sidebar",
    },
    hooks: {
      beforeValidate: [
        ({ data, value }) => {
          if (data?._status === "published") {
            return true
          }
          return value
        },
      ],
    },
    ...checkboxOverrides,
  }

  /**
   *  SLUG FIELD
   */

  // @ts-expect-error - ts mismatch Partial<TextField> with TextField
  const slugField: TextField = {
    name: "slug",
    type: "text",
    index: true,
    label: "Slug",
    ...(slugOverrides || {}),
    hooks: {
      beforeValidate: [formatSlugHook(fieldToUse)],
    },
    admin: {
      position: "sidebar",
      ...(slugOverrides?.admin || {}),
      components: {
        Field: {
          path: "@/admin/payload/fields/slug/slug-component#SlugComponent",
          clientProps: {
            fieldToUse,
            checkboxFieldPath: checkBoxField.name,
          },
        },
      },
    },
  }

  /**
   *  URI FIELD
   * Read-only field used by the smart routing engine
   */

  // @ts-expect-error - ts mismatch Partial<TextField> with TextField
  const uriField: TextField = {
    name: "uri",
    type: "text",
    index: true,
    label: "URI",
    ...(uriOverrides || {}),

    admin: {
      position: "sidebar",
      readOnly: true,
      hidden: true,
      description: "Auto-generated on publish based on slug and routing settings",
      ...(uriOverrides?.admin || {}),
    },
  }

  return [slugField, uriField, checkBoxField]
}
