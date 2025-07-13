import * as React from "react"
import { tv, type VariantProps } from "tailwind-variants"
import { cn } from "@/utilities/ui"

const textareaVariants = tv({
  base: [
    "placeholder:text-dark-100 flex field-sizing-content min-h-16 w-full border bg-transparent px-3 py-2",
    "text-base transition-[color] outline-none focus-visible:ring-[2px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  ],
  variants: {
    variant: {
      default: [
        "border-form-light-border",
        "focus-visible:border-primary focus-visible:ring-primary/50",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        "dark:bg-input/30",
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

function Textarea({
  className,
  variant,
  ...props
}: React.ComponentProps<"textarea"> & VariantProps<typeof textareaVariants>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(textareaVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Textarea, textareaVariants }
