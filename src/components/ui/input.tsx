import * as React from "react"
import { tv, type VariantProps } from "tailwind-variants"
import { cn } from "@/utilities/ui"

const inputVariants = tv({
  base: [
    "file:text-foreground placeholder:text-dark-100 selection:bg-primary selection:text-primary-foreground",
    "flex h-9 w-full min-w-0 border bg-transparent px-3 py-1 text-base transition-[color,box-shadow] outline-none",
    "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
    "placeholder:text-sm disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
    "focus-visible:ring-[2px]",
  ],
  variants: {
    variant: {
      default: [
        "border-form-light-border",
        "focus-visible:border-primary focus-visible:ring-primary/50",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
      ],
      "form-white": [
        "border-form-light-border text-dark bg-white",
        "placeholder:text-dark-200",
        "focus-visible:border-primary focus-visible:ring-primary/50",
        "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
      ],
      "form-dark": [
        "border-form-dark-border bg-dark text-white",
        "placeholder:text-dark-200",
        "focus-visible:border-primary focus-visible:ring-primary/50",
        "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
      ],
      "form-neutral": [
        "border-form-neutral-border bg-neutral text-dark",
        "placeholder:text-dark-200",
        "focus-visible:border-primary focus-visible:ring-primary/50",
        "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
      ],
      "form-transparent": [
        "border-form-transparent-border bg-transparent text-white",
        "placeholder:text-dark-200",
        "focus-visible:border-primary focus-visible:ring-primary/50",
        "aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
      ],
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

function Input({
  className,
  type,
  variant,
  ...props
}: React.ComponentProps<"input"> & VariantProps<typeof inputVariants>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Input, inputVariants }
