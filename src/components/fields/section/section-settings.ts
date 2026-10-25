import type { Field } from "payload"

import type {
  SectionColorScheme,
  SectionContainerWidth,
  SectionPaddingValue,
} from "@/components/fields/section/types"

const containerWidthOptions: Array<{ label: string; value: SectionContainerWidth }> = [
  { label: "Container (standard)", value: "lg" },
  { label: "Container medium", value: "md" },
  { label: "Container small", value: "sm" },
  { label: "Full width", value: "full" },
]

const colorSchemeOptions: Array<{ label: string; value: SectionColorScheme }> = [
  { label: "Light", value: "light" },
  { label: "Neutral", value: "neutral" },
  { label: "Dark", value: "dark" },
]

const paddingOptions: Array<{ label: string; value: SectionPaddingValue }> = [
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
            defaultValue: "lg",
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
                name: "paddingTop",
                label: "Padding top",
                type: "select",
                defaultValue: "default",
                options: paddingOptions,
                admin: {
                  width: "25%",
                },
              },
              {
                name: "paddingRight",
                label: "Padding right",
                type: "select",
                defaultValue: "default",
                options: paddingOptions,
                admin: {
                  width: "25%",
                },
              },
              {
                name: "paddingBottom",
                label: "Padding bottom",
                type: "select",
                defaultValue: "default",
                options: paddingOptions,
                admin: {
                  width: "25%",
                },
              },
              {
                name: "paddingLeft",
                label: "Padding left",
                type: "select",
                defaultValue: "default",
                options: paddingOptions,
                admin: {
                  width: "25%",
                },
              },
            ],
          },
        ],
      },
    ],
  }
}
