import { createDefaultButton } from "@/utilities/button-variants"

export const fullwidthCtaDefault = {
  heading: "See the Difference in Minutes",
  description:
    "Watch a fast demo and see how intelligent automation transforms your workflow: less effort, more results.",
  textAlignment: "left" as const,
  colorScheme: "gradient" as const,
  backgroundImage:
    "https://res.cloudinary.com/wild-creative/image/upload/v1748834621/meeting_3_hbtmkr.jpg",
  button: createDefaultButton({
    variant: "white",
    size: "lg",
    link: {
      type: "custom",
      url: "/demo",
      label: "Watch Demo",
    },
  }),
  blockType: "fullwidth-cta" as const,
}
