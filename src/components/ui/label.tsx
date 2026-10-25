"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { tv } from "tailwind-variants"
import { cn } from "@/lib/ui"

const labelStyles = tv({
  base: [
    "mb-control-sm flex items-center gap-control-sm text-sm font-light leading-none text-dark",
    "select-none",
    "group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50",
    "peer-disabled:cursor-not-allowed peer-disabled:opacity-60",
  ],
})

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(labelStyles(), className)}
      {...props}
    />
  )
}

export { Label, labelStyles }
