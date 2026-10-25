import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { tv, type VariantProps } from "tailwind-variants"
import { cn } from "@/lib/ui"

const buttonVariants = tv({
  base: [
    "inline-flex items-center justify-center whitespace-nowrap",
    "gap-control-sm border border-transparent",
    "transition-[color,background-color,border-color,box-shadow]",
    "shrink-0 outline-none",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
    "focus-visible:ring-primary/50 focus-visible:ring-[3px]",
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
  ],
  variants: {
    variant: {
      default: [
        "from-secondary-700 to-primary bg-gradient-to-r",
        "text-white shadow-xs hover:opacity-90",
      ],
      outline: [
        "border-dark-border text-dark bg-transparent",
        "hover:bg-neutral hover:text-dark",
        "focus-visible:ring-dark/20",
      ],
      outlineDark: [
        "border-dark text-dark bg-transparent",
        "hover:bg-dark hover:text-white",
        "focus-visible:ring-dark/20",
      ],
      outlineGradient: [
        "gradient-border",
        "bg-white/5 text-dark backdrop-blur-sm",
        "hover:bg-white hover:text-dark",
        "focus-visible:ring-dark/20",
      ],
      secondary: ["bg-secondary text-white shadow-xs", "hover:bg-secondary/80"],
      white: [
        "border-dark-border bg-white text-dark shadow-xs",
        "hover:bg-white/95",
        "focus-visible:ring-dark/20",
      ],
      dark: ["bg-dark text-white shadow-xs", "hover:bg-dark/90"],
      ghost: ["bg-neutral text-dark", "hover:bg-neutral/80"],
      link: "text-primary underline-offset-4 hover:underline",
    },
    layout: {
      default: "justify-center",
      centered: "justify-center [&>svg]:ml-0",
    },
    size: {
      sm: ["px-control-sm py-control-sm text-xs gap-control-sm", "[&_svg:not([class*='size-'])]:size-4"],
      md: ["px-control-md py-control-md text-sm gap-control-sm", "[&_svg:not([class*='size-'])]:size-5"],
      lg: ["px-control-lg py-control-lg text-base gap-control-lg", "[&_svg:not([class*='size-'])]:size-6"],
      xl: ["px-control-xl py-control-xl text-lg gap-control-xl", "[&_svg:not([class*='size-'])]:size-7"],
    },
    icon: {
      true: [
        "justify-center gap-0",
        "[&>svg]:ml-0",
      ],
    },
  },
  defaultVariants: {
    variant: "default",
    layout: "default",
    size: "md",
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
