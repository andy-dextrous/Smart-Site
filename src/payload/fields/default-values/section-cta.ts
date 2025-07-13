import { createDefaultButton } from "@/utilities/button-variants"

export const sectionCtaDefault = {
  text: "Didn't find what you're looking for? Explore our full capabilities",
  button: createDefaultButton({
    variant: "default",
    size: "lg",
    layout: "default",
    icon: false,
    link: {
      type: "custom",
      label: "View All Services",
      url: "/services",
      newTab: false,
    },
  }),
}
