import deepMerge from "@/utilities/deep-merge"
import { link } from "@/payload/fields/link"
import type { Field } from "payload"
import { getButtonVariantOptions, createDefaultButton } from "@/utilities/button-variants"

/*************************************************************************/
/*  GET BUTTON VARIANT OPTIONS
/*************************************************************************/

const { variantOptions, layoutOptions, sizeOptions } = getButtonVariantOptions()

/*************************************************************************/
/*  BUTTONS GROUP FIELD
/*************************************************************************/

export const buttonsGroup = (overrides: Partial<Field> = {}): Field => {
  return deepMerge(
    {
      name: "buttons",
      type: "array",
      fields: [
        {
          name: "button",
          type: "group",
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
                    description: "Select the button variant",
                    width: "33%",
                  },
                },
                {
                  name: "size",
                  type: "select",
                  label: "Button size",
                  defaultValue: "lg",
                  options: sizeOptions,
                  admin: {
                    description: "Select the button size",
                    width: "33%",
                  },
                },
                {
                  name: "layout",
                  type: "select",
                  label: "Button layout",
                  defaultValue: "default",
                  options: layoutOptions,
                  admin: {
                    description: "Select the button layout",
                    width: "34%",
                  },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "icon",
                  type: "checkbox",
                  label: "Icon button",
                  defaultValue: false,
                  admin: {
                    description: "Make this an icon-only button",
                    width: "50%",
                  },
                },
              ],
            },
            link(),
          ],
          defaultValue: [
            {
              button: createDefaultButton({
                variant: "default",
                link: {
                  type: "custom",
                  newTab: true,
                  url: "google.com",
                  label: "Button 1",
                },
              }),
            },
            {
              button: createDefaultButton({
                variant: "dark",
                link: {
                  type: "custom",
                  newTab: true,
                  url: "google.com",
                  label: "Button 2",
                },
              }),
            },
          ],
        },
      ],
    },
    overrides
  )
}

/*************************************************************************/
/*  SINGLE BUTTON FIELD
/*************************************************************************/

export const button = (overrides: Partial<Field> = {}): Field => {
  return deepMerge(
    {
      name: "button",
      type: "group",
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
                description: "Select the button variant",
                width: "33%",
              },
            },
            {
              name: "size",
              type: "select",
              label: "Button size",
              defaultValue: "lg",
              options: sizeOptions,
              admin: {
                description: "Select the button size",
                width: "33%",
              },
            },
            {
              name: "layout",
              type: "select",
              label: "Button layout",
              defaultValue: "default",
              options: layoutOptions,
              admin: {
                description: "Select the button layout",
                width: "34%",
              },
            },
          ],
        },
        {
          type: "row",
          fields: [
            {
              name: "icon",
              type: "checkbox",
              label: "Icon button",
              defaultValue: false,
              admin: {
                description: "Make this an icon-only button",
                width: "50%",
              },
            },
          ],
        },
        link(),
      ],
    },
    overrides
  )
}
