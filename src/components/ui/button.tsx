import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { tv, type VariantProps } from "tailwind-variants"
import { cn } from "@/utilities/ui"

const buttonVariants = tv({
  base: [
    "inline-flex items-center justify-between whitespace-nowrap",
    "box-border",
    "font-medium transition-all",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none",
    "shrink-0 outline-none [&_svg]:shrink-0",
    "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
    "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
    "aria-invalid:border-destructive",
    "[&>svg]:ml-auto [&>svg]:flex-none",
  ],
  variants: {
    variant: {
      default: [
        "from-secondary-700 to-primary bg-gradient-to-r",
        "text-white shadow-xs hover:opacity-90",
      ],
      outline: [
        "border-light-border border bg-white/3 backdrop-blur-[5px]",
        "text-white",
        "hover:text-dark hover:bg-white",
        "focus-visible:ring-white/50",
      ],
      outlineDark: [
        "border-dark-border border bg-white/3 backdrop-blur-[5px]",
        "text-dark",
        "hover:text-dark hover:bg-white",
        "focus-visible:ring-white/50",
      ],
      outlineGradient: [
        "gradient-border",
        "bg-white/2 backdrop-blur-sm",
        "text-white",
        "hover:text-dark hover:bg-white",
        "focus-visible:ring-white/50",
      ],
      phoneSelect: [
        "border-input bg-background hover:bg-accent hover:text-accent-foreground border",
        "text-foreground font-medium",
      ],
      secondary: [
        "bg-secondary text-secondary-foreground shadow-xs",
        "hover:bg-secondary/80",
      ],
      white: ["text-dark bg-white", "hover:bg-white/90"],
      dark: ["bg-dark text-white", "hover:bg-dark/90"],
      ghost: [
        "bg-white/5 backdrop-blur-[5px]",
        "text-white hover:bg-white/10 hover:text-white",
      ],
      link: "text-primary underline-offset-4 hover:underline",
    },
    layout: {
      default: "",
      centered: "justify-center [&>svg]:ml-0",
    },
    size: {
      default: [
        "gap-1.5 px-3 py-1.5 text-xs",
        "sm:gap-2 sm:px-3.5 sm:py-2 sm:text-xs",
        "lg:gap-2 lg:px-4 lg:py-2 lg:text-sm",
        "[&_svg:not([class*='size-'])]:size-5",
        "sm:[&_svg:not([class*='size-'])]:size-5",
        "lg:[&_svg:not([class*='size-'])]:size-6",
        "has-[>svg]:px-2",
        "sm:has-[>svg]:px-2.5",
        "lg:has-[>svg]:px-3",
      ],
      sm: [
        "gap-1 px-2.5 py-1 text-xs",
        "sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs",
        "lg:gap-2 lg:px-3 lg:py-2 lg:!text-xs",
        "[&_svg:not([class*='size-'])]:size-4",
        "sm:[&_svg:not([class*='size-'])]:size-5",
        "lg:[&_svg:not([class*='size-'])]:size-6",
        "has-[>svg]:px-2",
        "sm:has-[>svg]:px-2",
        "lg:has-[>svg]:px-2.5",
      ],
      md: [
        "gap-2 px-4 py-2 text-sm",
        "sm:gap-2.5 sm:px-5 sm:py-3 sm:text-sm",
        "lg:gap-3 lg:px-6 lg:py-4 lg:text-sm",
        "[&_svg:not([class*='size-'])]:size-5",
        "sm:[&_svg:not([class*='size-'])]:size-6",
        "lg:[&_svg:not([class*='size-'])]:size-6",
        "has-[>svg]:px-3",
        "sm:has-[>svg]:px-4",
        "lg:has-[>svg]:px-5",
      ],
      lg: [
        "gap-2.5 px-5 py-3 text-sm",
        "sm:gap-3 sm:px-6 sm:py-4 sm:text-sm",
        "lg:gap-4 lg:px-8 lg:py-6 lg:text-sm",
        "[&_svg:not([class*='size-'])]:size-6",
        "sm:[&_svg:not([class*='size-'])]:size-6",
        "lg:[&_svg:not([class*='size-'])]:size-6",
      ],
      phoneSelect: [
        "h-9 gap-1 px-3 py-2 text-sm",
        "[&_svg:not([class*='size-'])]:size-4",
      ],
    },
    icon: {
      true: [
        "size-16 justify-center text-lg",
        "[&_svg:not([class*='size-'])]:size-8",
        "[&>svg]:ml-0",
      ],
    },
  },
  compoundVariants: [
    {
      layout: ["default", "centered"],
      size: ["default", "sm", "md", "lg"],
      class: "[&>svg]:h-6 [&>svg]:w-6",
    },
  ],
  defaultVariants: {
    variant: "default",
    layout: "default",
    size: "lg",
  },
})

function Button({
  className,
  variant,
  size,
  layout,
  icon,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, layout, icon, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  ref?: React.Ref<HTMLButtonElement>
}
