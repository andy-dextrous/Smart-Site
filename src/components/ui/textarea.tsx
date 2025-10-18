import * as React from "react"
import { tv } from "tailwind-variants"
import { cn } from "@/utilities/ui"

const textareaStyles = tv({
  base: [
    "flex min-h-16 w-full rounded-md border px-control-lg py-control-lg text-sm transition-[color,box-shadow]",
    "bg-white text-dark placeholder:text-dark-600/70 selection:bg-primary selection:text-white",
    "border-dark-border focus-visible:border-primary focus-visible:ring-primary/50 focus-visible:ring-[2px]",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60",
    "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
  ],
})

function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(textareaStyles(), className)}
      {...props}
    />
  )
}

export { Textarea, textareaStyles }
