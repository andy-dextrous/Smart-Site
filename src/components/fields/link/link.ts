import type { CollectionSlug, Field, GroupField } from "payload"
import deepMerge from "@/admin/utilities/deep-merge"
import { getFrontendCollections } from "@/admin/config/frontend"

type LinkType = (options?: {
  disableLabel?: boolean
  optional?: boolean
  overrides?: Partial<GroupField>
}) => Field

export const link: LinkType = ({ disableLabel = false, optional = false, overrides = {} } = {}) => {
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
              width: "50%",
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
            name: "newTab",
            type: "checkbox",
            defaultValue: false,
            admin: {
              style: {
                alignSelf: "flex-end",
              },
              width: "50%",
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
      relationTo: getFrontendCollections().map(
        collection => collection.slug
      ) as CollectionSlug[],
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
            Field: "@/admin/components/fields/link/link-label-field#LinkLabelField",
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

  return deepMerge(linkResult, overrides)
}
