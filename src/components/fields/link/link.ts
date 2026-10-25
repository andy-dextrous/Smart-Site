import type { CollectionSlug, Field, GroupField } from "payload"
import deepMerge from "@/utilities/deep-merge"
import { iconPickerField } from "@/fields/icon-picker"
import { getButtonVariantOptions } from "@/components/fields/link/button-options"

const { variantOptions, layoutOptions, sizeOptions } = getButtonVariantOptions()

type LinkAppearance = "link" | "button"

type LinkType = (options?: {
  disableLabel?: boolean
  optional?: boolean
  defaultAppearance?: LinkAppearance
  overrides?: Partial<GroupField>
}) => Field

export const link: LinkType = ({
  disableLabel = false,
  optional = false,
  defaultAppearance = "link",
  overrides = {},
} = {}) => {
  const linkResult: GroupField = {
    name: "link",
    label: false,
    type: "group",
    admin: {
      hideGutter: true,
    },
    fields: [
      {
        type: "row",
        fields: [
          {
            name: "type",
            type: "radio",
            admin: {
              layout: "horizontal",
              width: "40%",
            },
            defaultValue: "reference",
            options: [
              {
                label: "Internal link",
                value: "reference",
              },
              {
                label: "Custom URL",
                value: "custom",
              },
            ],
          },
          {
            name: "appearance",
            type: "radio",
            defaultValue: defaultAppearance,
            options: [
              { label: "Text link", value: "link" },
              { label: "Button", value: "button" },
            ],
            admin: {
              layout: "horizontal",
              width: "40%",
            },
          },
          {
            name: "newTab",
            type: "checkbox",
            defaultValue: false,
            admin: {
              style: {
                alignSelf: "flex-end",
              },
              width: "20%",
            },
            label: "Open in new tab",
          },
        ],
      },
    ],
  }

  const linkTypes: Field[] = [
    {
      name: "reference",
      type: "relationship",
      admin: {
        condition: (_, siblingData) => siblingData?.type === "reference",
      },
      label: "Document to link to",
      relationTo: ["__smartsite_website_link__"] as unknown as CollectionSlug[],
      custom: { smartsiteWebsiteLink: true },
      required: !optional,
    },
    {
      name: "url",
      type: "text",
      admin: {
        condition: (_, siblingData) => siblingData?.type === "custom",
      },
      label: "Custom URL",
      required: !optional,
    },
  ]

  if (!disableLabel) {
    linkTypes.forEach(linkField => {
      linkField.admin = {
        ...(linkField.admin || {}),
        width: "50%",
      }
    })

    linkResult.fields.push({
      type: "row",
      fields: [
        ...linkTypes,
        {
          name: "label",
          type: "text",
          admin: {
            width: "50%",
            components: {
              Field: "@/components/content-fields/link/link-label-field#LinkLabelField",
            },
          },
          label: "Label",
          required: !optional,
        },
      ],
    })
  } else {
    linkResult.fields = [...linkResult.fields, ...linkTypes]
  }

  const iconField = iconPickerField({
    name: "icon",
    label: "Button icon",
    adminDescription: "Upload an SVG icon to display within the button.",
    adminWidth: "50%",
  })

  linkResult.fields.push({
    type: "collapsible",
    label: "Button options",
    admin: {
      initCollapsed: true,
      condition: (_, siblingData) => siblingData?.appearance === "button",
    },
    fields: [
      {
        type: "row",
        fields: [
          {
            name: "variant",
            type: "select",
            label: "Button variant",
            defaultValue: "default",
            options: variantOptions,
            admin: {
              width: "33%",
              description: "Select the button variant",
            },
          },
          {
            name: "size",
            type: "select",
            label: "Button size",
            defaultValue: "lg",
            options: sizeOptions,
            admin: {
              width: "33%",
              description: "Select the button size",
            },
          },
          {
            name: "layout",
            type: "select",
            label: "Button layout",
            defaultValue: "default",
            options: layoutOptions,
            admin: {
              width: "34%",
              description: "Select the button layout",
            },
          },
        ],
      },
      {
        name: "iconOnly",
        type: "checkbox",
        label: "Icon button",
        defaultValue: false,
        admin: {
          description:
            "Render the button as icon-only with optional label for screen readers.",
          width: "100%",
        },
      },
      {
        type: "row",
        admin: {
          condition: (_, siblingData) => siblingData?.iconOnly === true,
        },
        fields: [
          iconField,
          {
            name: "iconPosition",
            type: "select",
            label: "Icon position",
            defaultValue: "left",
            options: [
              { label: "Left of text", value: "left" },
              { label: "Right of text", value: "right" },
            ],
            admin: {
              width: "50%",
            },
          },
        ],
      },
    ],
  })

  return deepMerge(linkResult, overrides)
}
