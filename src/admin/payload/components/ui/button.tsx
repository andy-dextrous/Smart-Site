import { type VariantProps, cva } from "class-variance-authority"
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/admin/utilities/ui"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors duration-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent disabled:pointer-events-none disabled:opacity-50 border-solid",
  {
    variants: {
      variant: {
        default:
          "bg-admin-150 text-admin-900 hover:bg-admin-200 border border-admin-150 dark:bg-admin-800 dark:text-admin-100 dark:hover:bg-admin-750 dark:border-admin-750",
        secondary:
          "bg-admin-accent border-admin-accent text-admin-0 hover:bg-admin-accent-light shadow-sm",
        outline:
          "border border-admin-300 bg-transparent text-admin-900 hover:bg-admin-100 hover:border-admin-400 dark:border-admin-700 dark:text-admin-100 dark:hover:bg-admin-850 dark:hover:border-admin-600",
        ghost:
          "bg-admin-100 text-admin-900 hover:bg-admin-200 hover:text-admin-950 border-none dark:bg-admin-800 dark:text-admin-100 dark:hover:bg-admin-850 dark:hover:text-admin-50",
        destructive: "bg-admin-error text-admin-0 hover:bg-admin-error/90 shadow-sm",
        success: "bg-admin-success text-admin-0 hover:bg-admin-success/90 shadow-sm",
        warning: "bg-admin-warning text-admin-0 hover:bg-admin-warning/90 shadow-sm",
        link: "text-admin-accent underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        xs: "h-7 px-2 text-xs rounded [&_svg]:h-3 [&_svg]:w-3",
        sm: "h-8 px-3 text-sm rounded [&_svg]:h-3.5 [&_svg]:w-3.5",
        default: "h-10 px-4 py-2 [&_svg]:h-4 [&_svg]:w-4",
        lg: "h-11 px-6 text-base [&_svg]:h-5 [&_svg]:w-5",
        xl: "h-12 px-8 text-lg [&_svg]:h-5 [&_svg]:w-5",
        icon: "h-10 w-10 p-0 [&_svg]:h-4 [&_svg]:w-4",
        "icon-sm": "h-8 w-8 p-0 [&_svg]:h-3.5 [&_svg]:w-3.5",
        "icon-lg": "h-12 w-12 p-0 [&_svg]:h-5 [&_svg]:w-5",
        "icon-round": "h-12 w-12 p-0 rounded-full [&_svg]:h-4 [&_svg]:w-4",
        "icon-round-sm": "h-8 w-8 p-0 rounded-full [&_svg]:h-3.5 [&_svg]:w-3.5",
        "icon-round-lg": "h-16 w-16 p-0 rounded-full [&_svg]:h-6 [&_svg]:w-6",
        "icon-round-xl": "h-20 w-20 p-0 rounded-full [&_svg]:h-8 [&_svg]:w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
