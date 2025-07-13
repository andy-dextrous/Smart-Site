"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { tv, type VariantProps } from "tailwind-variants"
import { cn } from "@/utilities/ui"

const labelVariants = tv({
  base: [
    "mb-2 flex items-center gap-2 text-xs leading-none font-light select-none",
    "group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50",
    "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
  ],
  variants: {
    variant: {
      default: "text-dark",
      "form-white": "text-dark",
      "form-dark": "text-white",
      "form-neutral": "text-dark",
      "form-transparent": "text-dark",
    },
    size: {
      default: "text-sm",
      "form-white": "text-sm",
      "form-dark": "text-sm",
      "form-neutral": "text-sm",
      "form-transparent": "text-sm",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
})

function Label({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root> &
  VariantProps<typeof labelVariants>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(labelVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Label, labelVariants }
