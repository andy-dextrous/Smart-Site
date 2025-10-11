import type { Field } from "payload"

import type {
  SectionColorScheme,
  SectionContainerWidth,
  SectionPaddingX,
  SectionPaddingY,
} from "./types"

const containerWidthOptions: Array<{ label: string; value: SectionContainerWidth }> = [
  { label: "Compact", value: "sm" },
  { label: "Standard", value: "md" },
  { label: "Wide", value: "lg" },
  { label: "Full width", value: "full" },
]

const colorSchemeOptions: Array<{ label: string; value: SectionColorScheme }> = [
  { label: "Light", value: "light" },
  { label: "Neutral", value: "neutral" },
  { label: "Dark", value: "dark" },
  { label: "Surface", value: "surface" },
  { label: "Transparent", value: "transparent" },
]

const paddingXOptions: Array<{ label: string; value: SectionPaddingX }> = [
  { label: "Default", value: "default" },
  { label: "None", value: "none" },
  { label: "Compact", value: "xs" },
  { label: "Narrow", value: "sm" },
  { label: "Wide", value: "lg" },
  { label: "Extra Wide", value: "xl" },
]

const paddingYOptions: Array<{ label: string; value: SectionPaddingY }> = [
  { label: "Default", value: "default" },
  { label: "None", value: "none" },
  { label: "Extra Small", value: "xs" },
  { label: "Small", value: "sm" },
  { label: "Medium", value: "md" },
  { label: "Large", value: "lg" },
  { label: "Extra Large", value: "xl" },
  { label: "XX-Large", value: "xxl" },
]

interface SectionSettingsOptions {
  collapsibleLabel?: string
  initCollapsed?: boolean
}

export function sectionSettings(options: SectionSettingsOptions = {}): Field {
  const { collapsibleLabel = "Section Settings", initCollapsed = true } = options

  return {
    type: "collapsible",
    label: collapsibleLabel,
    admin: {
      initCollapsed,
    },
    fields: [
      {
        name: "sectionSettings",
        type: "group",
        admin: {
          description:
            "Control how this section renders on the frontend—attributes, layout width, colours, and padding.",
        },
        fields: [
          {
            label: "Attributes",
            name: "attributes",
            type: "array",
            labels: {
              singular: "Attribute",
              plural: "Attributes",
            },
            admin: {
              description:
                "Add arbitrary HTML attributes. Useful for IDs, custom classes, ARIA labels, or data attributes.",
              initCollapsed: true,
            },
            fields: [
              {
                name: "key",
                type: "text",
                required: true,
                admin: {
                  placeholder: "id, class, data-theme, aria-label",
                },
              },
              {
                name: "value",
                type: "text",
                required: true,
                admin: {
                  placeholder: "hero, section-highlight, dark, …",
                },
              },
            ],
          },
          {
            name: "containerWidth",
            label: "Container width",
            type: "select",
            defaultValue: "md",
            options: containerWidthOptions,
          },
          {
            name: "colorScheme",
            label: "Colour scheme",
            type: "select",
            defaultValue: "light",
            options: colorSchemeOptions,
          },
          {
            type: "row",
            fields: [
              {
                name: "paddingX",
                label: "Horizontal padding",
                type: "select",
                defaultValue: "default",
                options: paddingXOptions,
                admin: {
                  width: "50%",
                },
              },
              {
                name: "paddingY",
                label: "Vertical padding",
                type: "select",
                defaultValue: "default",
                options: paddingYOptions,
                admin: {
                  width: "50%",
                },
              },
            ],
          },
        ],
      },
    ],
  }
}
