import { createDefaultButton } from "@/utilities/button-variants"

export const buttonsDefault = [
  createDefaultButton({
    variant: "default",
    link: {
      type: "custom",
      newTab: false,
      url: "https://www.google.com",
      label: "Button 1",
    },
  }),
]

export const buttonsGroupDefault = [
  createDefaultButton({
    variant: "default",
    link: {
      type: "custom",
      newTab: false,
      url: "https://www.google.com",
      label: "Button 1",
    },
  }),
  createDefaultButton({
    variant: "secondary",
    link: {
      type: "custom",
      newTab: false,
      url: "https://www.google.com",
      label: "Button 2",
    },
  }),
]
